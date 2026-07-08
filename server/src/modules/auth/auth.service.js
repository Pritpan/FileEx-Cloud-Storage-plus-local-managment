// =============================================================================
// auth.service.js
//
// Responsibility: Business logic for the auth module.
// Services never touch req or res.
// =============================================================================

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import * as authRepository from './auth.repository.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ---------------------------------------------------------------------------
// hashToken — SHA-256 hash of a raw token string.
// Only the hash is stored in the DB; the raw value is returned to the client.
// ---------------------------------------------------------------------------
const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

// ---------------------------------------------------------------------------
// sanitiseUser — strip hashedPassword before returning user data.
// This function must be called every time a user object leaves the service.
// ---------------------------------------------------------------------------
const sanitiseUser = ({ hashedPassword: _, ...safe }) => safe;

// ---------------------------------------------------------------------------
// createServiceError — produce a typed error the controller can inspect.
// ---------------------------------------------------------------------------
const createServiceError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

// ---------------------------------------------------------------------------
// generateTokenPair — shared token generation logic used by login & refresh.
// ---------------------------------------------------------------------------
const generateTokenPair = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  return { accessToken, rawRefreshToken, tokenHash, expiresAt };
};

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
export const register = async ({ name, email, password }) => {
  // Guard: reject duplicate email before touching bcrypt (expensive)
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw createServiceError(
      'An account with this email already exists.',
      409,
      'EMAIL_CONFLICT',
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepository.createUser({
    name,
    email,
    hashedPassword,
    avatarUrl: null,
  });

  return {
    success: true,
    message: 'User registered successfully.',
    data: sanitiseUser(user),
  };
};

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
export const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  // Use a generic message — never reveal whether the email exists.
  if (!user) {
    throw createServiceError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!passwordMatch) {
    throw createServiceError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const { accessToken, rawRefreshToken, tokenHash, expiresAt } = generateTokenPair(user);

  await authRepository.saveRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return {
    success: true,
    data: {
      user: sanitiseUser(user),
      accessToken,
      refreshToken: rawRefreshToken,
    },
  };
};

// ---------------------------------------------------------------------------
// refresh
//
// FIX-1: Now checks isRevoked in addition to expiry.
// FIX-2: Token rotation (delete old + save new) is now a single atomic
//        Prisma $transaction to prevent session loss on mid-rotation crash.
// ---------------------------------------------------------------------------
export const refresh = async (rawRefreshToken) => {
  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await authRepository.findRefreshToken(tokenHash);

  if (!storedToken) {
    throw createServiceError('Invalid refresh token.', 401, 'INVALID_TOKEN');
  }

  // Check both revocation status and expiry
  if (storedToken.isRevoked || new Date() > storedToken.expiresAt) {
    // Clean up the stale/revoked token
    await authRepository.deleteRefreshToken(tokenHash);
    throw createServiceError('Refresh token is invalid or has expired.', 401, 'EXPIRED_TOKEN');
  }

  const user = await authRepository.findUserById(storedToken.userId);
  if (!user) {
    await authRepository.deleteRefreshToken(tokenHash);
    throw createServiceError('User no longer exists.', 401, 'UNAUTHORIZED');
  }

  const { accessToken, rawRefreshToken: newRawRefreshToken, tokenHash: newTokenHash, expiresAt } = generateTokenPair(user);

  // Atomic rotation: delete old token and save new token in a single transaction.
  // If either operation fails, both are rolled back — no session loss.
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { tokenHash } }),
    prisma.refreshToken.create({ data: { userId: user.id, tokenHash: newTokenHash, expiresAt } }),
  ]);

  return {
    success: true,
    data: {
      accessToken,
      refreshToken: newRawRefreshToken,
    },
  };
};

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
export const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw createServiceError('Refresh token is required.', 400, 'MISSING_TOKEN');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await authRepository.findRefreshToken(tokenHash);

  if (!stored) {
    throw createServiceError('Invalid or already revoked refresh token.', 401, 'INVALID_TOKEN');
  }

  await authRepository.deleteRefreshToken(tokenHash);

  return { success: true, message: 'Logged out successfully.' };
};

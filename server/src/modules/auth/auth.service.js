// =============================================================================
// auth.service.js
//
// Responsibility: Business logic for the auth module.
// Services never touch req or res.
// =============================================================================

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authRepository from './auth.repository.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY  = '15m';
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
// getModuleStatus
// ---------------------------------------------------------------------------
export const getModuleStatus = async () => ({
  success: true,
  message: 'Authentication module is ready.',
});

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

  // Access token — short-lived JWT, stored in memory on the client.
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  // Refresh token — cryptographically random, stored as a hash in the DB.
  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await authRepository.saveRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return {
    success: true,
    data: {
      user: sanitiseUser(user),
      accessToken,
      refreshToken: rawRefreshToken, // client stores this securely (HTTP-only cookie in production)
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

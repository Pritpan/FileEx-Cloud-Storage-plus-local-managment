// =============================================================================
// auth.service.js
//
// Responsibility: Business logic for the auth module.
// Services never touch req or res.
//
// Registration transaction:
//   User creation and StorageStats creation are wrapped in a single
//   prisma.$transaction(). If either insert fails, both are rolled back.
//   This guarantees every active user always has exactly one StorageStats row.
// =============================================================================

import bcrypt from 'bcrypt';
import prisma from '../../config/prisma.js';
import authRepository from './auth.repository.js';
import storageStatsRepository from '../storage/storage-stats.repository.js';
import { generateTokenPair, hashToken } from './token.service.js';

const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// sanitiseUser — strip hashedPassword before returning user data.
// This function must be called every time a user object leaves the service.
// ---------------------------------------------------------------------------
const sanitiseUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatarUrl,
  storageUsed: user.storageStats ? Number(user.storageStats.usedStorage) : 0,
  storageLimit: user.storageStats ? Number(user.storageStats.storageLimit) : 104857600,
});

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
// register
//
// Transaction flow:
//   1. Duplicate-email check  — runs BEFORE the transaction.
//      Reading before writing avoids holding a transaction open during a
//      read-only guard. If the email is taken, we throw immediately.
//   2. bcrypt.hash()          — runs BEFORE the transaction.
//      Password hashing is CPU-bound (~100 ms). Keeping it outside the
//      transaction minimises the time MySQL holds row locks.
//   3. prisma.$transaction()  — atomic block:
//        a. authRepository.createUser()         → inserts into `users`
//        b. storageStatsRepository.create()     → inserts into `storage_stats`
//      If either insert fails (e.g. FK violation, duplicate key), MySQL
//      rolls back both inserts automatically.
//   4. Token generation       — runs AFTER the transaction.
//      Tokens are not persisted in this call, so they do not belong inside
//      the atomic block.
// ---------------------------------------------------------------------------
export const register = async ({ name, email, password }) => {
  // Step 1 — guard: reject duplicate email before touching bcrypt
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw createServiceError(
      'An account with this email already exists.',
      409,
      'EMAIL_CONFLICT',
    );
  }

  // Step 2 — hash password outside the transaction (CPU-bound work)
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Step 3 — atomic: create User + StorageStats in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await authRepository.createUser(
      { name, email, hashedPassword, avatarUrl: null },
      tx,
    );

    await storageStatsRepository.create({ userId: newUser.id }, tx);

    return newUser;
  });

  // Step 4 — Generate tokens
  const { accessToken, rawRefreshToken, tokenHash, expiresAt } = generateTokenPair(user);
  await authRepository.saveRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return {
    success: true,
    message: 'Registration successful',
    data: {
      user: sanitiseUser(user),
      accessToken,
      refreshToken: rawRefreshToken,
    },
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
// ---------------------------------------------------------------------------
export const refresh = async (rawRefreshToken) => {
  const tokenHash   = hashToken(rawRefreshToken);
  const storedToken = await authRepository.findRefreshToken(tokenHash);

  if (!storedToken) {
    throw createServiceError('Invalid refresh token.', 401, 'INVALID_TOKEN');
  }

  if (storedToken.isRevoked || new Date() > storedToken.expiresAt) {
    await authRepository.deleteRefreshToken(tokenHash);
    throw createServiceError('Refresh token is invalid or has expired.', 401, 'EXPIRED_TOKEN');
  }

  const user = await authRepository.findUserById(storedToken.userId);
  if (!user) {
    await authRepository.deleteRefreshToken(tokenHash);
    throw createServiceError('User no longer exists.', 401, 'UNAUTHORIZED');
  }

  const {
    accessToken,
    rawRefreshToken: newRawRefreshToken,
    tokenHash: newTokenHash,
    expiresAt,
  } = generateTokenPair(user);

  // Atomic rotation: delete old token and save new token in a single transaction.
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { tokenHash } }),
    prisma.refreshToken.create({ data: { userId: user.id, tokenHash: newTokenHash, expiresAt } }),
  ]);

  return {
    success: true,
    data: {
      user: sanitiseUser(user),
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
  const stored    = await authRepository.findRefreshToken(tokenHash);

  if (!stored) {
    throw createServiceError('Invalid or already revoked refresh token.', 401, 'INVALID_TOKEN');
  }

  await authRepository.deleteRefreshToken(tokenHash);

  return { success: true, message: 'Logged out successfully.' };
};

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
export const updateProfile = async (userId, { name }) => {
  if (!name?.trim()) {
    throw createServiceError('Name is required.', 400, 'VALIDATION_ERROR');
  }

  const updated = await authRepository.updateUser(userId, { name: name.trim() });

  return {
    success: true,
    data: { user: sanitiseUser(updated) },
  };
};

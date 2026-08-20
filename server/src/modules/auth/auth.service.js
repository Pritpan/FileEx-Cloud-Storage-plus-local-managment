import bcrypt from 'bcrypt';
import prisma from '../../config/prisma.js';
import authRepository from './auth.repository.js';
import storageStatsRepository from '../storage/storage-stats.repository.js';
import { generateTokenPair, hashToken } from './token.service.js';

const SALT_ROUNDS = 10;

const sanitiseUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatarUrl,
  storageUsed: user.storageStats ? Number(user.storageStats.usedStorage) : 0,
  storageLimit: user.storageStats ? Number(user.storageStats.storageLimit) : 104857600,
});

const createServiceError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

export const register = async ({ name, email, password }) => {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw createServiceError(
      'An account with this email already exists.',
      409,
      'EMAIL_CONFLICT',
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await authRepository.createUser(
      { name, email, hashedPassword, avatarUrl: null },
      tx,
    );

    await storageStatsRepository.create({ userId: newUser.id }, tx);

    return newUser;
  });

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

export const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

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

export const refresh = async (rawRefreshToken) => {
  const tokenHash = hashToken(rawRefreshToken);
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

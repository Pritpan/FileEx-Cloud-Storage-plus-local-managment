import bcrypt from 'bcrypt';
import prisma from '../../config/prisma.js';
import authRepository from './auth.repository.js';
import storageStatsRepository from '../storage/storage-stats.repository.js';
import { generateTokenPair, generateVerificationToken, generatePasswordResetToken, hashToken } from './token.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/email.service.js';
import { deleteAllUserFiles } from '../files/file.service.js';

const SALT_ROUNDS = 10;

const sanitiseUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified ?? false,
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

// ── Helper: issue and store a verification token, then email it ───────────────
const issueAndSendVerificationToken = async (user) => {
  const { rawToken, tokenHash, expiresAt } = generateVerificationToken();
  await authRepository.saveEmailVerificationToken({ userId: user.id, tokenHash, expiresAt });
  // Fire-and-forget: don't fail registration if SMTP is misconfigured in dev
  sendVerificationEmail({ to: user.email, name: user.name, rawToken }).catch((err) => {
    console.error('[email] Failed to send verification email:', err.message);
  });
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

  // Send verification email after transaction commits successfully
  await issueAndSendVerificationToken(user);

  return {
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      user: sanitiseUser(user),
      // No tokens issued yet — user must verify email before being fully logged in
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

  if (!user.emailVerified) {
    throw createServiceError(
      'Please verify your email address before logging in. Check your inbox for a verification link.',
      403,
      'EMAIL_NOT_VERIFIED',
    );
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

// ── Email Verification ────────────────────────────────────────────────────────

export const verifyEmail = async (rawToken) => {
  if (!rawToken) {
    throw createServiceError('Verification token is required.', 400, 'MISSING_TOKEN');
  }

  const tokenHash = hashToken(rawToken);
  const record = await authRepository.findEmailVerificationToken(tokenHash);

  if (!record) {
    throw createServiceError('This verification link is invalid.', 400, 'INVALID_TOKEN');
  }

  if (record.usedAt !== null) {
    throw createServiceError('This verification link has already been used.', 400, 'TOKEN_ALREADY_USED');
  }

  if (new Date() > record.expiresAt) {
    throw createServiceError(
      'This verification link has expired. Please request a new one.',
      400,
      'TOKEN_EXPIRED',
    );
  }

  // Mark token used + mark user verified in a single transaction
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
  ]);

  return {
    success: true,
    message: 'Email verified successfully. You can now log in.',
  };
};

export const resendVerification = async (email) => {
  if (!email) {
    throw createServiceError('Email address is required.', 400, 'VALIDATION_ERROR');
  }

  const user = await authRepository.findUserByEmail(email);

  // Always respond the same way to avoid account enumeration
  if (!user || user.emailVerified) {
    return {
      success: true,
      message: 'If an unverified account exists with that email, a new verification link has been sent.',
    };
  }

  // Invalidate all previous unused tokens before issuing a new one
  await authRepository.deleteEmailVerificationTokensForUser(user.id);
  await issueAndSendVerificationToken(user);

  return {
    success: true,
    message: 'If an unverified account exists with that email, a new verification link has been sent.',
  };
};

export const deleteAccount = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw createServiceError('User not found.', 404, 'NOT_FOUND');
  }

  // First securely delete all files (S3 and DB) bottom-up
  await deleteAllUserFiles(userId);

  // Then delete the user. Thanks to Prisma schema cascade, this deletes:
  // refreshTokens, emailVerifyTokens, and storageStats automatically.
  await prisma.user.delete({ where: { id: userId } });

  return { success: true, message: 'Account deleted successfully.' };
};




export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw createServiceError('User not found.', 404, 'NOT_FOUND');
  
  const match = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!match) throw createServiceError('Incorrect current password.', 400, 'INVALID_PASSWORD');
  
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updateUser(userId, { hashedPassword });
  
  return { success: true, message: 'Password updated successfully.' };
};

export const forgotPassword = async (email) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    // Return same message regardless of whether the user exists to prevent enumeration
    return {
      success: true,
      message: 'If an account exists for this email, you\'ll receive a password reset link shortly.',
    };
  }

  // Generate and save token
  const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken();
  await authRepository.savePasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  // Send the reset email
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    rawToken,
  });

  return {
    success: true,
    message: 'If an account exists for this email, you\'ll receive a password reset link shortly.',
  };
};

export const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);
  const resetRecord = await authRepository.findPasswordResetToken(tokenHash);

  if (!resetRecord || resetRecord.usedAt !== null) {
    throw createServiceError('Invalid or expired password reset link.', 400, 'TOKEN_INVALID');
  }

  if (new Date() > resetRecord.expiresAt) {
    throw createServiceError('This password reset link has expired.', 400, 'TOKEN_EXPIRED');
  }

  // Hash new password and update user
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  await prisma.$transaction(async (tx) => {
    // 1. Update user password
    await authRepository.updateUser(resetRecord.userId, { hashedPassword }, tx);
    
    // 2. Invalidate all existing refresh tokens
    await authRepository.deleteAllRefreshTokens(resetRecord.userId, tx);
    
    // 3. Mark token as used
    await authRepository.markPasswordResetTokenUsed(resetRecord.id, tx);
  });

  return {
    success: true,
    message: 'Password reset successfully. You can now log in.',
  };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw createServiceError('User not found.', 404, 'NOT_FOUND');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createServiceError('The current password you entered is incorrect.', 401, 'INCORRECT_PASSWORD');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    await authRepository.updateUser(userId, { hashedPassword }, tx);
    await authRepository.deleteAllRefreshTokens(userId, tx);
  });

  return {
    success: true,
    message: 'Password changed successfully.',
  };
};
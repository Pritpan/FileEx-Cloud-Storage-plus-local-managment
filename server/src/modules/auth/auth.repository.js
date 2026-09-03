import prisma from '../../config/prisma.js';

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  storageStats: {
    select: {
      usedStorage: true,
      storageLimit: true,
    },
  },
};

const findUserByEmail = async (email, db = prisma) => {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      hashedPassword: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      storageStats: {
        select: {
          usedStorage: true,
          storageLimit: true,
        },
      },
    },
  });
};

const findUserById = async (id, db = prisma) => {
  return db.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });
};

const createUser = async ({ name, email, hashedPassword, avatarUrl = null }, db = prisma) => {
  return db.user.create({
    data: { name, email, hashedPassword, avatarUrl },
    select: SAFE_USER_SELECT,
  });
};

const updateUser = async (id, data, db = prisma) => {
  return db.user.update({
    where: { id },
    data,
    select: SAFE_USER_SELECT,
  });
};

const saveRefreshToken = async ({ userId, tokenHash, expiresAt }, db = prisma) => {
  return db.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
    select: { id: true },
  });
};

const findRefreshToken = async (tokenHash, db = prisma) => {
  return db.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      tokenHash: true,
      userId: true,
      expiresAt: true,
      isRevoked: true,
    },
  });
};

const deleteRefreshToken = async (tokenHash, db = prisma) => {
  return db.refreshToken.delete({
    where: { tokenHash },
    select: { id: true },
  });
};

const deleteAllRefreshTokens = async (userId, db = prisma) => {
  return db.refreshToken.deleteMany({ where: { userId } });
};

// ── Email Verification Token ─────────────────────────────────────────────────

const saveEmailVerificationToken = async ({ userId, tokenHash, expiresAt }, db = prisma) => {
  return db.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
    select: { id: true },
  });
};

const findEmailVerificationToken = async (tokenHash, db = prisma) => {
  return db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      expiresAt: true,
      usedAt: true,
    },
  });
};

/**
 * Mark a verification token as used (single-use enforcement).
 */
const markEmailVerificationTokenUsed = async (id, db = prisma) => {
  return db.emailVerificationToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
};

/**
 * Delete all unused verification tokens for a user (used when resending).
 */
const deleteEmailVerificationTokensForUser = async (userId, db = prisma) => {
  return db.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  });
};

const authRepository = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  // Email verification
  saveEmailVerificationToken,
  findEmailVerificationToken,
  markEmailVerificationTokenUsed,
  deleteEmailVerificationTokensForUser,
};

export default authRepository;

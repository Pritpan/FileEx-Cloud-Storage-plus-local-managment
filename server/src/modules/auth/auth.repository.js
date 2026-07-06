// =============================================================================
// auth.repository.js
//
// Responsibility: All database access for the auth module.
//
// Repositories are the ONLY layer that talks to Prisma.
// Services call repositories — services never import Prisma directly.
//
// Rule: One repository per module. No cross-module repository imports.
// See: docs/DATABASE_DESIGN.md — User, RefreshToken, StorageStats models.
// =============================================================================

import prisma from '../../config/prisma.js';

// ---------------------------------------------------------------------------
// createUser
//
// Inserts a new User row into the `users` table.
//
// @param {object} userData
// @param {string} userData.name
// @param {string} userData.email          - already lowercased by RegisterSchema
// @param {string} userData.hashedPassword - bcrypt hash (plain text in this chunk — temporary)
// @param {string|null} [userData.avatarUrl]
//
// @returns {Promise<User>} The created Prisma User object.
//
// Note: No duplicate email check here.
//       That guard lives in the service layer (added in the next chunk).
//       The DB unique constraint on `email` is the final safety net.
// ---------------------------------------------------------------------------
export const createUser = async ({ name, email, hashedPassword, avatarUrl = null }) => {
  return prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      avatarUrl,
    },
  });
};

// ---------------------------------------------------------------------------
// Pending methods — implemented as auth features are built:
//
// findUserByEmail(email)
//   → prisma.user.findUnique({ where: { email } })
//
// findUserById(id)
//   → prisma.user.findUnique({ where: { id } })
//
// saveRefreshToken({ userId, tokenHash, expiresAt })
//   → prisma.refreshToken.create(...)
//
// findRefreshToken(tokenHash)
//   → prisma.refreshToken.findUnique({ where: { tokenHash } })
//
// deleteRefreshToken(tokenHash)
//   → prisma.refreshToken.delete({ where: { tokenHash } })
//
// deleteAllRefreshTokens(userId)
//   → prisma.refreshToken.deleteMany({ where: { userId } })
// ---------------------------------------------------------------------------

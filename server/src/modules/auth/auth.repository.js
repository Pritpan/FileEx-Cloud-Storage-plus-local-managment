// =============================================================================
// auth.repository.js
//
// Responsibility: All database access for the auth module.
//
// Repositories are the ONLY layer that talks to Prisma.
// Services call repositories — services never import Prisma directly.
//
// TODO: Import Prisma client when the User model is added to schema.prisma.
// TODO: Implement the following methods:
//
//   findUserByEmail(email)
//     → Returns a user record by email, or null if not found.
//
//   findUserById(id)
//     → Returns a user record by primary key.
//
//   createUser({ firstName, lastName, email, hashedPassword, storageQuota })
//     → Inserts a new user row and initialises their StorageStats record.
//
//   saveRefreshToken({ userId, tokenHash, expiresAt })
//     → Inserts a RefreshToken row for the given user.
//
//   findRefreshToken(tokenHash)
//     → Returns the RefreshToken record matching the hash, or null.
//
//   deleteRefreshToken(tokenHash)
//     → Removes a single RefreshToken row (logout).
//
//   deleteAllRefreshTokens(userId)
//     → Removes all RefreshToken rows for a user (logout everywhere).
//
// See: docs/DATABASE_DESIGN.md — User, RefreshToken, StorageStats models.
// =============================================================================

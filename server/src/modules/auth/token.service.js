// =============================================================================
// token.service.js
//
// Responsibility: Pure token utilities — hashing and generation.
//
// This module has NO knowledge of the database, HTTP, or business rules.
// It receives a user object and returns cryptographic material only.
//
// Consumed by:
//   - auth.service.js (login, refresh)
// =============================================================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY      = '15m';
const REFRESH_TOKEN_EXPIRY_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// hashToken
//
// Produces a deterministic SHA-256 hex digest of a raw token string.
// The raw token is returned to the client; only the hash is persisted in DB.
// ---------------------------------------------------------------------------
export const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

// ---------------------------------------------------------------------------
// generateTokenPair
//
// Given a user object (must have .id and .email), returns:
//   - accessToken      — signed JWT, valid for 15 minutes
//   - rawRefreshToken  — 64-byte random hex string (client-facing)
//   - tokenHash        — SHA-256 of rawRefreshToken (DB-persisted)
//   - expiresAt        — Date object, 7 days from now (stored on RefreshToken row)
// ---------------------------------------------------------------------------
export const generateTokenPair = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash       = hashToken(rawRefreshToken);
  const expiresAt       = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  return { accessToken, rawRefreshToken, tokenHash, expiresAt };
};

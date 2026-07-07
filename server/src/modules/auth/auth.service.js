// =============================================================================
// auth.service.js
//
// Responsibility: Business logic for the auth module.
//
// Services orchestrate:
//   - Password hashing (bcrypt)
//   - Repository calls (DB access)
//   - Side effects (notifications, activity logs — added in later chunks)
//
// Services never touch req or res.
// =============================================================================

import bcrypt from 'bcrypt';
import * as authRepository from './auth.repository.js';

// bcrypt cost factor — 10 rounds is the industry standard balance between
// security and performance (~100ms per hash on modern hardware).
// Higher = slower to brute-force, but also slower per legitimate login.
const SALT_ROUNDS = 10;

/**
 * Returns module status.
 */
export const getModuleStatus = async () => {
  return {
    success: true,
    message: 'Authentication module is ready.',
  };
};

/**
 * register({ name, email, password })
 *
 * Orchestrates user registration:
 *   1. Hash the plain-text password with bcrypt.
 *   2. Persist the user via the repository.
 *   3. Return a sanitised user object (hashedPassword excluded).
 *
 * TODO (next chunk): check authRepository.findUserByEmail — reject if duplicate
 */
export const register = async ({ name, email, password }) => {
  // Hash the password before it touches the database.
  // bcrypt.hash() internally generates a random salt and embeds it in the hash —
  // no need to store the salt separately.
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepository.createUser({
    name,
    email,
    hashedPassword,
    avatarUrl: null,
  });

  // Never return hashedPassword to the caller.
  // Destructure it out and return only safe fields.
  const { hashedPassword: _, ...safeUser } = user;

  return {
    success: true,
    message: 'User registered successfully.',
    data: safeUser,
  };
};

// ---------------------------------------------------------------------------
// Pending methods:
//
// export const login   = async ({ email, password }) => { ... };
// export const refresh = async (refreshToken) => { ... };
// export const logout  = async (refreshToken) => { ... };
// ---------------------------------------------------------------------------

// =============================================================================
// auth.service.js
//
// Responsibility: Business logic for the auth module.
//
// Services orchestrate:
//   - Validation (via validators, added later)
//   - Repository calls (DB access, added later)
//   - Side effects (notifications, activity logs, added later)
//
// Services never touch req or res.
// =============================================================================

import * as authRepository from './auth.repository.js';

/**
 * Returns module status.
 * Placeholder until real auth logic (register, login) is implemented.
 */
export const getModuleStatus = async () => {
  return {
    success: true,
    message: 'Authentication module is ready.',
  };
};

/**
/**
 * register({ name, email, password })
 *
 * Orchestrates user registration.
 *
 * ⚠️  TEMPORARY: password is passed directly as hashedPassword.
 *     This will be replaced with bcrypt.hash() in the next chunk.
 *
 * TODO (next chunk): check authRepository.findUserByEmail — reject if duplicate
 * TODO (next chunk): replace `password` with `await bcrypt.hash(password, 12)`
 */
export const register = async ({ name, email, password }) => {
  const user = await authRepository.createUser({
    name,
    email,
    hashedPassword: password,  // ⚠️ TEMPORARY — plain text, replace with bcrypt
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

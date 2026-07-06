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
 * register(userData)
 *
 * Receives validated data from the controller.
 *
 * Current: skeleton — returns the data to confirm the flow works end-to-end.
 *
 * Next chunk will:
 *   1. Check authRepository.findUserByEmail — reject if duplicate
 *   2. bcrypt.hash(password) — never store plaintext
 *   3. authRepository.createUser — insert row + init StorageStats
 *   4. Return sanitised user object (no hashedPassword)
 */
export const register = async (userData) => {
  // TODO (next chunk): check for duplicate email
  // TODO (next chunk): hash password with bcrypt
  // TODO (next chunk): persist via authRepository.createUser()

  return {
    success: true,
    message: 'Register flow working.',
    data: userData,
  };
};

// ---------------------------------------------------------------------------
// Pending methods:
//
// export const login   = async ({ email, password }) => { ... };
// export const refresh = async (refreshToken) => { ... };
// export const logout  = async (refreshToken) => { ... };
// ---------------------------------------------------------------------------

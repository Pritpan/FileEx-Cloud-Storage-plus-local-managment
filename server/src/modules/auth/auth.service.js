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

// ---------------------------------------------------------------------------
// Future methods — added in subsequent chunks:
//
// export const register = async ({ firstName, lastName, email, password }) => { ... };
// export const login    = async ({ email, password }) => { ... };
// export const refresh  = async (refreshToken) => { ... };
// export const logout   = async (refreshToken) => { ... };
// ---------------------------------------------------------------------------

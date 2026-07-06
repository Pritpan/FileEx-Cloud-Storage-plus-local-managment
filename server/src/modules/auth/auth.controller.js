// =============================================================================
// auth.controller.js
//
// Responsibility: Handle HTTP — parse the request, call the service,
//                 return the response.
//
// Controllers never contain business logic.
// All decisions are made in the service layer.
// =============================================================================

import * as authService from './auth.service.js';
import { RegisterSchema } from './auth.schema.js';

/**
 * GET /api/v1/auth
 * Returns the module status. Used to verify the auth module is mounted.
 */
export const getModuleStatus = async (_req, res) => {
  const result = await authService.getModuleStatus();
  res.json(result);
};

/**
 * POST /api/v1/auth/register
 *
 * 1. Validate req.body against RegisterSchema.
 *    On failure → 400 with structured validation errors.
 * 2. Pass validated data to the service.
 * 3. Return 201 with the service result.
 *
 * The controller knows nothing about passwords, databases, or tokens.
 */
export const register = async (req, res) => {
  // Validate — safeParse returns { success, data } or { success, error }
  // without throwing, so we control the response shape ourselves.
  const parsed = RegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  const result = await authService.register(parsed.data);
  return res.status(201).json(result);
};

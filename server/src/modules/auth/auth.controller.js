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

/**
 * GET /api/v1/auth
 * Returns the module status. Used to verify the auth module is mounted.
 */
export const getModuleStatus = async (_req, res) => {
  const result = await authService.getModuleStatus();
  res.json(result);
};

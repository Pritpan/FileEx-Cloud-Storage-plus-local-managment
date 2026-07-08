// =============================================================================
// auth.controller.js
//
// Responsibility: HTTP only — parse request, validate, call service, respond.
// Controllers never contain business logic.
// =============================================================================

import * as authService from './auth.service.js';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schema.js';

// ---------------------------------------------------------------------------
// Reusable: parse a Zod schema against req.body and return the result.
// Returns { ok: true, data } or { ok: false, response } (ready to send).
// ---------------------------------------------------------------------------
const validate = (schema, body) => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          issues: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      },
    };
  }
  return { ok: true, data: parsed.data };
};

// ---------------------------------------------------------------------------
// Reusable: handle a service call that may throw a typed error.
// ---------------------------------------------------------------------------
const handleService = async (res, fn) => {
  try {
    const result = await fn();
    return result;
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
    return null;
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
export const register = async (req, res) => {
  const { ok, data, response } = validate(RegisterSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.register(data));
  if (result) res.status(201).json(result);
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
export const login = async (req, res) => {
  const { ok, data, response } = validate(LoginSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.login(data));
  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/refresh
// ---------------------------------------------------------------------------
export const refresh = async (req, res) => {
  const { ok, data, response } = validate(RefreshSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.refresh(data.refreshToken));
  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  const result = await handleService(res, () => authService.logout(refreshToken));
  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me  (protected — requires authenticate middleware)
// ---------------------------------------------------------------------------
export const getMe = async (req, res) => {
  // req.user is attached by the authenticate middleware.
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

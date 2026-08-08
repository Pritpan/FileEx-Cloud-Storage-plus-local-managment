// =============================================================================
// auth.controller.js
//
// Responsibility: HTTP only — parse request, validate, call service, respond.
// Controllers never contain business logic.
// =============================================================================

import * as authService from './auth.service.js';
import { RegisterSchema, LoginSchema, RefreshSchema, UpdateProfileSchema } from './auth.schema.js';

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
// Cookie Helpers
// ---------------------------------------------------------------------------
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh', // Keep it scoped strictly to the refresh endpoint
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
  });
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
export const register = async (req, res) => {
  const { ok, data, response } = validate(RegisterSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.register(data));
  if (result) {
    setRefreshCookie(res, result.data.refreshToken);
    delete result.data.refreshToken;
    res.status(201).json(result);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
export const login = async (req, res) => {
  const { ok, data, response } = validate(LoginSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.login(data));
  if (result) {
    setRefreshCookie(res, result.data.refreshToken);
    delete result.data.refreshToken;
    res.status(200).json(result);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/refresh
// ---------------------------------------------------------------------------
export const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Refresh token is missing.' },
    });
  }

  const result = await handleService(res, () => authService.refresh(refreshToken));
  if (result) {
    setRefreshCookie(res, result.data.refreshToken);
    delete result.data.refreshToken;
    res.status(200).json(result);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------
export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      await authService.logout(refreshToken);
    } catch (err) {
      // Ignore DB errors (e.g. token already revoked) — we still want to clear the cookie.
    }
  }

  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
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

// ---------------------------------------------------------------------------
// PATCH /api/v1/auth/me  (protected)
// ---------------------------------------------------------------------------
export const updateMe = async (req, res) => {
  const { ok, data, response } = validate(UpdateProfileSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    authService.updateProfile(req.user.id, data),
  );

  if (result) res.status(200).json(result);
};

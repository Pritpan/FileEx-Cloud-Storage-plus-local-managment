import * as authService from './auth.service.js';
import { RegisterSchema, LoginSchema, UpdateProfileSchema, ResendVerificationSchema, ForgotPasswordSchema, ResetPasswordSchema, ChangePasswordSchema } from './auth.schema.js';

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

const setRefreshCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth/refresh',
  });
};

const clearRefreshCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth/refresh',
  });
};

export const register = async (req, res) => {
  const { ok, data, response } = validate(RegisterSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.register(data));
  // Registration now returns 201 but no tokens — user must verify email first
  if (result) {
    res.status(201).json(result);
  }
};

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

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      await authService.logout(refreshToken);
    } catch (err) {
      // Best-effort logout; continue to clear cookie
    }
  }

  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

export const updateMe = async (req, res) => {
  const { ok, data, response } = validate(UpdateProfileSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    authService.updateProfile(req.user.id, data),
  );

  if (result) res.status(200).json(result);
};

export const verifyEmail = async (req, res) => {
  const token = req.query?.token;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Verification token is required.' },
    });
  }

  const result = await handleService(res, () => authService.verifyEmail(token));
  if (result) res.status(200).json(result);
};

export const resendVerification = async (req, res) => {
  const { ok, data, response } = validate(ResendVerificationSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.resendVerification(data.email));
  if (result) res.status(200).json(result);
};

export const deleteAccount = async (req, res) => {
  const result = await handleService(res, () => authService.deleteAccount(req.user.id));
  if (result) {
    clearRefreshCookie(res);
    res.status(200).json(result);
  }
};

export const forgotPassword = async (req, res) => {
  const { ok, data, response } = validate(ForgotPasswordSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.forgotPassword(data.email));
  if (result) res.status(200).json(result);
};

export const resetPassword = async (req, res) => {
  const { ok, data, response } = validate(ResetPasswordSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.resetPassword(data.token, data.newPassword));
  if (result) res.status(200).json(result);
};

export const changePassword = async (req, res) => {
  const { ok, data, response } = validate(ChangePasswordSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () => authService.changePassword(req.user.id, data.currentPassword, data.newPassword));
  if (result) res.status(200).json(result);
};


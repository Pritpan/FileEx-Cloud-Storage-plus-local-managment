import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { rateLimitConfig } from '../config/rateLimit.js';

const handler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: options.message,
    }
  });
};

const keyGeneratorAuth = (req, res) => {
  // If user is authenticated, use their ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  // Fallback to IP if somehow not authenticated
  return `ip:${ipKeyGenerator(req, res)}`;
};

const keyGeneratorLogin = (req, res) => {
  // IP + normalized email
  const email = req.body?.email?.toLowerCase().trim() || '';
  return `login:${ipKeyGenerator(req, res)}:${email}`;
};

const keyGeneratorIp = (req, res) => {
  return `ip:${ipKeyGenerator(req, res)}`;
};

export const loginLimiter = rateLimit({
  windowMs: rateLimitConfig.login.windowMs,
  max: rateLimitConfig.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorLogin,
  message: 'Too many login attempts. Please try again later.'
});

export const registerLimiter = rateLimit({
  windowMs: rateLimitConfig.register.windowMs,
  max: rateLimitConfig.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorIp,
  message: 'Too many registration attempts. Please try again later.'
});

export const refreshLimiter = rateLimit({
  windowMs: rateLimitConfig.refresh.windowMs,
  max: rateLimitConfig.refresh.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorIp,
  message: 'Too many refresh token requests. Please try again later.'
});

export const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.api.windowMs,
  max: rateLimitConfig.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorAuth,
  message: 'Too many requests. Please try again later.'
});

export const uploadLimiter = rateLimit({
  windowMs: rateLimitConfig.upload.windowMs,
  max: rateLimitConfig.upload.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorAuth,
  message: 'Upload limit exceeded. Please try again later.'
});

export const downloadLimiter = rateLimit({
  windowMs: rateLimitConfig.download.windowMs,
  max: rateLimitConfig.download.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorAuth,
  message: 'Download limit exceeded. Please try again later.'
});

export const destructiveLimiter = rateLimit({
  windowMs: rateLimitConfig.destructive.windowMs,
  max: rateLimitConfig.destructive.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: keyGeneratorAuth,
  message: 'Too many destructive operations. Please try again later.'
});

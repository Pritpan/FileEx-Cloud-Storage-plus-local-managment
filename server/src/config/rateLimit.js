import dotenv from 'dotenv';
dotenv.config();

// Sensible defaults in milliseconds
const MINUTES_15 = 15 * 60 * 1000;
const HOUR_1 = 60 * 60 * 1000;

export const rateLimitConfig = {
  login: {
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  },
  register: {
    windowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW, 10) || HOUR_1,
    max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX, 10) || 5,
  },
  refresh: {
    windowMs: parseInt(process.env.RATE_LIMIT_REFRESH_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_REFRESH_MAX, 10) || 20,
  },
  api: {
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 100,
  },
  upload: {
    windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10) || 20,
  },
  download: {
    windowMs: parseInt(process.env.RATE_LIMIT_DOWNLOAD_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_DOWNLOAD_MAX, 10) || 100,
  },
  destructive: {
    // Used for delete, create folder, rename, move
    windowMs: parseInt(process.env.RATE_LIMIT_DESTRUCTIVE_WINDOW, 10) || MINUTES_15,
    max: parseInt(process.env.RATE_LIMIT_DESTRUCTIVE_MAX, 10) || 30,
  },
  forgotPassword: {
    windowMs: parseInt(process.env.RATE_LIMIT_FORGOT_PWD_WINDOW, 10) || HOUR_1,
    max: parseInt(process.env.RATE_LIMIT_FORGOT_PWD_MAX, 10) || 3,
  },
  resetPassword: {
    windowMs: parseInt(process.env.RATE_LIMIT_RESET_PWD_WINDOW, 10) || HOUR_1,
    max: parseInt(process.env.RATE_LIMIT_RESET_PWD_MAX, 10) || 5,
  }
};

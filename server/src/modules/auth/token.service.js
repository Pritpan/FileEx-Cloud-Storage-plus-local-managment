import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

export const generateTokenPair = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  return { accessToken, rawRefreshToken, tokenHash, expiresAt };
};

/**
 * generateVerificationToken
 *
 * Creates a cryptographically secure random email-verification token.
 * Returns both the raw token (to be embedded in the email URL) and
 * its SHA-256 hash (to be stored in the database).
 *
 * DEFAULT expiry: 24 hours, overridable via EMAIL_VERIFY_EXPIRY_HOURS env var.
 */
export const generateVerificationToken = () => {
  const expiryHours = parseInt(process.env.EMAIL_VERIFY_EXPIRY_HOURS || '24', 10);
  const rawToken  = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
};

/**
 * generatePasswordResetToken
 *
 * Creates a secure random token for password resets.
 * DEFAULT expiry: 30 minutes, overridable via PASSWORD_RESET_TOKEN_EXPIRY_MINUTES env var.
 */
export const generatePasswordResetToken = () => {
  const expiryMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || '30', 10);
  const rawToken  = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
};

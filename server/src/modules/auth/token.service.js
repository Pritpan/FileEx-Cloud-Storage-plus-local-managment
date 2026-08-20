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

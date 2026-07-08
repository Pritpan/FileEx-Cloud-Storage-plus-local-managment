// =============================================================================
// middleware/authenticate.js
//
// Responsibility: Verify the JWT access token on protected routes.
//
// Usage:
//   import authenticate from '../../middleware/authenticate.js';
//   router.get('/me', authenticate, controller.getMe);
//
// On success: attaches { id, email, name, avatarUrl, createdAt } to req.user
// On failure: responds 401 immediately — the route handler is never called.
//
// NOTE: We look up the user from the DB on every request to ensure the
// account still exists and hasn't been deleted since the token was issued.
// This is a deliberate security trade-off. A Redis cache can be added later
// to avoid the DB round-trip on high-traffic routes.
// =============================================================================

import jwt from 'jsonwebtoken';
import * as authRepository from '../modules/auth/auth.repository.js';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Reject if header is absent or malformed
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Access token is required.' },
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    // jwt.verify throws TokenExpiredError, JsonWebTokenError, NotBeforeError
    const message = err.name === 'TokenExpiredError'
      ? 'Access token has expired.'
      : 'Access token is invalid.';

    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message },
    });
  }

  // Confirm the user still exists in the database
  const user = await authRepository.findUserById(payload.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User no longer exists.' },
    });
  }

  // Attach safe user object (no hashedPassword) to req
  const { hashedPassword: _, ...safeUser } = user;
  req.user = safeUser;

  next();
};

export default authenticate;

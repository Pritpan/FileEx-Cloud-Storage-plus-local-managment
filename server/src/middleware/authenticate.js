import jwt from 'jsonwebtoken';
import authRepository from '../modules/auth/auth.repository.js';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Access token is required.' },
    });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Access token has expired.'
      : 'Access token is invalid.';

    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message },
    });
  }

  let user;
  try {
    user = await authRepository.findUserById(payload.sub);
  } catch (err) {
    return next(err);
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User no longer exists.' },
    });
  }

  const { hashedPassword: _, ...safeUser } = user;
  req.user = safeUser;

  next();
};

export default authenticate;

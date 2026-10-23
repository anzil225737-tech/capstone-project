import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Please sign in to continue.' } });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Your session has expired. Please sign in again.' } });
  }
}

export function handleError(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Please check the information and try again.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' } });
}

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { readCookie } from '../utils/authCookies.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : readCookie(req, 'coursehub_access');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) return res.status(401).json({ message: 'Session expired' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

const studentMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Student role required.' });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : readCookie(req, 'coursehub_access');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('+tokenVersion');
    } catch (error) {
      req.user = null;
    }
  }
  next();
};

export { authMiddleware, optionalAuthMiddleware, adminMiddleware, studentMiddleware };

import jwt from 'jsonwebtoken';
import { findRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendError } from '../utils/apiResponse.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Please login to continue', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await findRow('Users', (item) => item.id === decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    req.user = withoutRowNumber(user);
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const adminMiddleware = async (req, res, next) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return sendError(res, 'Admin access required', 403);
  }

  next();
};

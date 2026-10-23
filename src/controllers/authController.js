import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRow, findRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const createToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return sendError(res, 'All fields are required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findRow('Users', (user) => user.email?.toLowerCase() === normalizedEmail || user.mobile === mobile);

    if (existingUser) {
      return sendError(res, 'User already exists with this email or mobile', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createRow('Users', {
        name,
        email: normalizedEmail,
        mobile,
        passwordHash,
        role: 'CUSTOMER',
        isActive: true,
    });

    const token = createToken(user);

    return sendSuccess(res, 'Registration successful', { user: { ...user, passwordHash: undefined }, token }, 201);
  } catch (error) {
    return sendError(res, 'Registration failed', 500, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await findRow('Users', (item) => item.email?.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = createToken(user);
    return sendSuccess(res, 'Login successful', { user: { ...withoutRowNumber(user), passwordHash: undefined }, token }, 200);
  } catch (error) {
    return sendError(res, 'Login failed', 500, error.message);
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await findRow('Users', (item) => item.email?.toLowerCase() === email.trim().toLowerCase());

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return sendError(res, 'Admin access denied', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return sendError(res, 'Invalid admin credentials', 401);
    }

    const token = createToken(user);
    return sendSuccess(res, 'Admin login successful', { user: { ...withoutRowNumber(user), passwordHash: undefined }, token }, 200);
  } catch (error) {
    return sendError(res, 'Admin login failed', 500, error.message);
  }
};

export const getCurrentUser = async (req, res) => {
  const user = await findRow('Users', (item) => item.id === req.user.id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, 'User fetched successfully', { user: { ...withoutRowNumber(user), passwordHash: undefined } });
};

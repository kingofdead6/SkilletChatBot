// controllers/authController.js
import asyncHandler from 'express-async-handler';
import validator from 'validator';
import User from '../models/User.js';

/**
 * Register a new user
 * POST /auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !validator.isLength(name.trim(), { min: 2, max: 100 })) {
    res.status(400);
    throw new Error('Name must be between 2 and 100 characters');
  }

  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('Email is already in use');
  }

  // Create user (password will be hashed by pre-save hook)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  // Return minimal data – no token needed
  return res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * Login user
 * POST /auth/login
 *
 * Returns success + user info (no token – using x-user-email header auth)
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Success – return minimal info
  // Frontend will store email in sessionStorage
  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    // message: 'Logged in successfully – use x-user-email header for protected routes',
  });
});
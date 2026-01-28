
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import validator from 'validator';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Register user request:', { name, email });

  if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
    console.error('Invalid name');
    res.status(400);
    throw new Error('Valid name required');
  }
  if (!email || !validator.isEmail(email)) {
    console.error('Invalid email');
    res.status(400);
    throw new Error('Valid email required');
  }
  if (!password || password.length < 6) {
    console.error('Invalid password');
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.error('Email already exists');
    res.status(400);
    throw new Error('Email already exists');
  }

  const user = await User.create({ name, email, password });
  console.log('User registered:', user._id);
  res.status(201).json({ id: user._id, name, email });
});



export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  if (!email || !validator.isEmail(email)) {
    console.error('Invalid email');
    res.status(400);
    throw new Error('Valid email is required');
  }
  if (!password) {
    console.error('Password required');
    res.status(400);
    throw new Error('Password is required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    console.error('Invalid credentials');
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({ token: user.generateToken() });
});
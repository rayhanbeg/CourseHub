import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationSchemas, validate } from '../utils/validation.js';

const generateToken = (id, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (id, expiresIn = process.env.JWT_REFRESH_EXPIRE) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

// Register User
export const register = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.registerUser, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Check if user already exists
    let user = await User.findOne({ email: value.email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    user = new User({
      name: value.name,
      email: value.email,
      password: value.password,
      role: 'student',
    });

    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Login User
export const login = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.loginUser, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Check if user exists
    const user = await User.findOne({ email: value.email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(value.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Get Current User
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        enrolledCourses: user.enrolledCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, profileImage },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

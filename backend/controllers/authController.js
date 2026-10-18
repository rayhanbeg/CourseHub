import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import User from '../models/User.js';
import { validationSchemas, validate } from '../utils/validation.js';
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from '../utils/email.js';
import { clearAuthCookies, readCookie, setAuthCookies } from '../utils/authCookies.js';

const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
};

const generateRefreshToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

const issueSession = (res, user) => {
  const accessToken = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0);
  setAuthCookies(res, accessToken, refreshToken);
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

    issueSession(res, user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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

    issueSession(res, user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = readCookie(req, 'coursehub_refresh') || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) return res.status(401).json({ message: 'Session expired' });
    issueSession(res, user);

    res.status(200).json({
      success: true,
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
    const { isValid, errors, value } = validate(validationSchemas.updateProfile, req.body);
    if (!isValid) return res.status(400).json({ errors });
    const { name, bio, profileImage } = value;

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

export const forgotPassword = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.forgotPassword, req.body);
    if (!isValid) return res.status(400).json({ errors });
    if (!isEmailDeliveryConfigured()) {
      return res.status(503).json({ message: 'Password reset email is not configured. Please contact support.' });
    }

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: 'If an account exists for that email, a reset link will be sent.' });
    }

    const resetToken = randomBytes(32).toString('hex');
    user.passwordResetToken = createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const baseUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(resetToken)}`;
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error('Password reset email delivery failed:', error.message);
      return res.status(503).json({ message: 'We could not send a reset email right now. Please try again later.' });
    }

    return res.status(200).json({ message: 'If an account exists for that email, a reset link will be sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.resetPassword, req.body);
    if (!isValid) return res.status(400).json({ errors });

    const hashedToken = createHash('sha256').update(value.token).digest('hex');
    const user = await User.findOne({
      email: value.email.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });

    user.password = value.password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    clearAuthCookies(res);

    return res.status(200).json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  clearAuthCookies(res);
  return res.status(200).json({ success: true });
};

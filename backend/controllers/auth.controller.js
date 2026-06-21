/* ============================================================
   controllers/auth.controller.js — Login & Auth Endpoints
   ============================================================ */

'use strict';

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const { AppError }  = require('../middleware/error.middleware');

/* ────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { username, password }
   ──────────────────────────────────────────────────────────── */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Fetch user with password (select: false by default)
    const user = await User.findOne({ username: username.toLowerCase().trim() })
      .select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases — prevents username enumeration
      return next(new AppError('Invalid username or password', 401));
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.displayName} ✦`,
      token,
      user:    user.toPublicJSON(),
    });

  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/auth/me
   Returns the currently authenticated user
   ──────────────────────────────────────────────────────────── */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      success: true,
      user:    user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   POST /api/auth/refresh
   Re-issues a JWT for a still-valid token holder
   ──────────────────────────────────────────────────────────── */
const refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user._id);
    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   POST /api/auth/logout  (client-side — invalidate locally)
   ──────────────────────────────────────────────────────────── */
const logout = async (req, res, next) => {
  try {
    // Mark user offline in DB
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      socketId: null,
      lastSeen: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Goodbye ✦',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, refreshToken, logout };

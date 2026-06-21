/* ============================================================
   middleware/auth.middleware.js — JWT Authentication
   ============================================================ */

'use strict';

const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { AppError } = require('./error.middleware');

/**
 * protect — verifies Bearer JWT token.
 * Attaches req.user for downstream handlers.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorised — no token provided', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'Session expired — please log in again'
        : 'Invalid token — please log in again';
      return next(new AppError(msg, 401));
    }

    // Fetch user (check still exists)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireAdmin — only admin role can proceed.
 * Must be used AFTER protect.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Access denied — admin only', 403));
  }
  next();
};

/**
 * requireOwnerOrAdmin — user can only access their own resource,
 * unless they are admin.
 */
const requireOwnerOrAdmin = (userIdField = 'params.id') => (req, res, next) => {
  const parts  = userIdField.split('.');
  let   target = req;
  for (const p of parts) target = target?.[p];

  const isOwner = req.user?._id?.toString() === target?.toString();
  const isAdmin = req.user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('Access denied — not authorised', 403));
  }
  next();
};

module.exports = { protect, requireAdmin, requireOwnerOrAdmin };

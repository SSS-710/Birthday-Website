/* ============================================================
   controllers/user.controller.js — User Endpoints
   ============================================================ */

'use strict';

const User             = require('../models/User');
const { AppError }     = require('../middleware/error.middleware');
const { getOnlineUsers } = require('../socket/socket.handler');

/* ────────────────────────────────────────────────────────────
   GET /api/users
   Returns both users with online status
   ──────────────────────────────────────────────────────────── */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    const onlineUsers = getOnlineUsers();

    const data = users.map((u) => ({
      ...u.toPublicJSON(),
      isOnline: onlineUsers.has(u._id.toString()),
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/users/:id
   ──────────────────────────────────────────────────────────── */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return next(new AppError('User not found', 404));

    const onlineUsers = getOnlineUsers();
    const data = {
      ...user.toPublicJSON(),
      isOnline: onlineUsers.has(user._id.toString()),
    };

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   PUT /api/users/avatar
   Body: { avatar }  — update emoji avatar
   ──────────────────────────────────────────────────────────── */
const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar?.trim()) {
      return next(new AppError('Avatar is required', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatar.trim() },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Avatar updated ✦',
      data:    user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateAvatar };

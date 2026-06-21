/* ============================================================
   controllers/message.controller.js — Chat Message CRUD
   ============================================================ */

'use strict';

const Message          = require('../models/Message');
const User             = require('../models/User');
const { AppError }     = require('../middleware/error.middleware');
const { getOnlineUsers } = require('../socket/socket.handler');

const POPULATE_SENDER   = { path: 'sender',   select: 'username displayName avatar' };
const POPULATE_RECEIVER = { path: 'receiver',  select: 'username displayName avatar' };

/* ────────────────────────────────────────────────────────────
   GET /api/messages?page=1&limit=50&before=<ISO_DATE>
   Returns paginated conversation between the two users
   ──────────────────────────────────────────────────────────── */
const getMessages = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(100, parseInt(req.query.limit) || 50);
    const skip    = (page - 1) * limit;
    const before  = req.query.before ? new Date(req.query.before) : null;

    // Build filter — either direction of the two-person conversation
    const filter = {
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      deleted: false,
    };

    if (before && !isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(POPULATE_SENDER)
        .populate(POPULATE_RECEIVER)
        .lean(),
      Message.countDocuments(filter),
    ]);

    // Return in ascending chronological order (oldest first)
    const ordered = messages.reverse();

    res.status(200).json({
      success: true,
      data: {
        messages: ordered,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   POST /api/messages
   Body: { receiverId, message }
   REST fallback if Socket.IO is unavailable
   ──────────────────────────────────────────────────────────── */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const receiver = await User.findById(receiverId);
    if (!receiver) return next(new AppError('Receiver not found', 404));

    const newMessage = await Message.create({
      sender:   senderId,
      receiver: receiverId,
      message:  message.trim(),
    });

    const populated = await newMessage
      .populate([POPULATE_SENDER, POPULATE_RECEIVER]);

    // Try to emit via Socket.IO to online receiver
    try {
      const { getIO } = require('../socket/socket.handler');
      const onlineUsers   = getOnlineUsers();
      const receiverSockId = onlineUsers.get(receiverId.toString());
      if (receiverSockId) {
        getIO().to(receiverSockId).emit('receive-message', populated.toJSON());
      }
    } catch (_) { /* Socket.IO not available — that's OK */ }

    res.status(201).json({
      success: true,
      message: 'Message sent ✦',
      data:    populated,
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   DELETE /api/messages/:id
   Soft-delete — sets deleted:true (content hidden in toJSON)
   ──────────────────────────────────────────────────────────── */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return next(new AppError('Message not found', 404));

    // Only sender or admin can delete
    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === 'admin';

    if (!isSender && !isAdmin) {
      return next(new AppError('Not authorised to delete this message', 403));
    }

    message.deleted   = true;
    message.deletedAt = new Date();
    await message.save();

    // Notify other user via socket
    try {
      const { getIO } = require('../socket/socket.handler');
      const onlineUsers = getOnlineUsers();
      const otherId = isSender
        ? message.receiver.toString()
        : message.sender.toString();
      const otherSockId = onlineUsers.get(otherId);
      if (otherSockId) {
        getIO().to(otherSockId).emit('message-deleted', { messageId: req.params.id });
      }
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Message deleted ✦' });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   PUT /api/messages/:id
   Body: { message }
   Edit message content (sender only, within 15 minutes)
   ──────────────────────────────────────────────────────────── */
const editMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return next(new AppError('Message not found', 404));

    if (msg.sender.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the sender can edit a message', 403));
    }

    if (msg.deleted) {
      return next(new AppError('Cannot edit a deleted message', 400));
    }

    // 15-minute edit window
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) {
      return next(new AppError('Edit window (15 minutes) has expired', 400));
    }

    msg.message  = req.body.message.trim();
    msg.edited   = true;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await msg.populate([POPULATE_SENDER, POPULATE_RECEIVER]);

    // Notify receiver
    try {
      const { getIO } = require('../socket/socket.handler');
      const onlineUsers = getOnlineUsers();
      const receiverSockId = onlineUsers.get(msg.receiver.toString());
      if (receiverSockId) {
        getIO().to(receiverSockId).emit('message-edited', populated.toJSON());
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Message updated ✦',
      data:    populated,
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────
   PUT /api/messages/seen
   Body: { messageIds: [] }
   Mark multiple messages as seen
   ──────────────────────────────────────────────────────────── */
const markSeen = async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return next(new AppError('messageIds array is required', 400));
    }

    const now = new Date();
    await Message.updateMany(
      {
        _id:      { $in: messageIds },
        receiver: req.user._id,
        seen:     false,
      },
      { seen: true, seenAt: now }
    );

    res.status(200).json({ success: true, message: 'Messages marked as seen ✦' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, editMessage, markSeen };

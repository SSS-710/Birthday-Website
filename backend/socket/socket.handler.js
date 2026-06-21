/* ============================================================
   socket/socket.handler.js — Socket.IO Realtime Engine
   ============================================================ */

'use strict';

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const Message    = require('../models/Message');
const logger     = require('../utils/logger');

let io;

/* ── Active users map: userId → socketId ───────────────────── */
const onlineUsers = new Map();

/* ── Initialise Socket.IO on the HTTP server ────────────────── */
function initSocket(server) {
  const clientUrl = [
    ...(process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean),
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
  ];

  io = new Server(server, {
    cors: {
      origin:      clientUrl,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
    transports:   ['websocket', 'polling'],
  });

  /* ── JWT Auth middleware for Socket.IO ───────────────────── */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');

      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  /* ── Connection handler ──────────────────────────────────── */
  io.on('connection', async (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: ${user.username} (${socket.id})`);

    /* -- Mark user online ------------------------------------ */
    onlineUsers.set(user._id.toString(), socket.id);

    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Notify other user they're online
    socket.broadcast.emit('user-online', {
      userId:      user._id,
      username:    user.username,
      displayName: user.displayName,
      avatar:      user.avatar,
    });

    /* ── SEND MESSAGE ──────────────────────────────────────── */
    socket.on('send-message', async (data, ack) => {
      try {
        const { receiverId, message } = data;

        if (!receiverId || !message?.trim()) {
          return ack?.({ success: false, error: 'Invalid message data' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return ack?.({ success: false, error: 'Receiver not found' });
        }

        // Save to MongoDB
        const newMsg = await Message.create({
          sender:   user._id,
          receiver: receiverId,
          message:  message.trim(),
        });

        // Populate sender info
        const populated = await newMsg.populate('sender', 'username displayName avatar');

        const payload = {
          _id:         populated._id,
          sender:      populated.sender,
          receiver:    receiverId,
          message:     populated.message,
          seen:        false,
          edited:      false,
          deleted:     false,
          createdAt:   populated.createdAt,
        };

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive-message', payload);
        }

        // Confirm to sender
        ack?.({ success: true, message: payload });

      } catch (err) {
        logger.error(`send-message error: ${err.message}`);
        ack?.({ success: false, error: 'Failed to send message' });
      }
    });

    /* ── TYPING ────────────────────────────────────────────── */
    socket.on('typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          senderId:    user._id,
          displayName: user.displayName,
        });
      }
    });

    /* ── STOP TYPING ───────────────────────────────────────── */
    socket.on('stop-typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stop-typing', { senderId: user._id });
      }
    });

    /* ── MESSAGE SEEN ──────────────────────────────────────── */
    socket.on('message-seen', async ({ messageId, senderId }) => {
      try {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          { seen: true, seenAt: new Date() },
          { new: true }
        );

        if (!updated) return;

        // Notify original sender
        const senderSocketId = onlineUsers.get(senderId?.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-seen', {
            messageId,
            seenAt: updated.seenAt,
          });
        }
      } catch (err) {
        logger.error(`message-seen error: ${err.message}`);
      }
    });

    /* ── DISCONNECT ────────────────────────────────────────── */
    socket.on('disconnect', async (reason) => {
      logger.info(`🔌 Socket disconnected: ${user.username} — ${reason}`);

      onlineUsers.delete(user._id.toString());

      const lastSeen = new Date();
      await User.findByIdAndUpdate(user._id, {
        isOnline: false,
        socketId: null,
        lastSeen,
      });

      socket.broadcast.emit('user-offline', {
        userId:   user._id,
        username: user.username,
        lastSeen,
      });
    });

    /* ── ERROR ─────────────────────────────────────────────── */
    socket.on('error', (err) => {
      logger.error(`Socket error for ${user.username}: ${err.message}`);
    });
  });

  logger.info('✅ Socket.IO initialised');
  return io;
}

/* ── Expose io instance ──────────────────────────────────────── */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialised — call initSocket first');
  return io;
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getIO, getOnlineUsers };

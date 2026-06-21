/* ============================================================
   server.js — Main Entry Point
   The Unknown Man — Production Backend
   ============================================================ */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
'use strict';

const http    = require('http');
const app     = require('./app');
const { initSocket } = require('./socket/socket.handler');
const connectDB      = require('./config/db');
const logger         = require('./utils/logger');

/* ── Load env ──────────────────────────────────────────────── */
require('dotenv').config();

const PORT = process.env.PORT || 5000;

/* ── Connect to MongoDB ────────────────────────────────────── */
connectDB();

/* ── Create HTTP server (required for Socket.IO) ───────────── */
const server = http.createServer(app);

/* ── Attach Socket.IO ──────────────────────────────────────── */
initSocket(server);

/* ── Start listening ───────────────────────────────────────── */
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

/* ── Unhandled rejections ──────────────────────────────────── */
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

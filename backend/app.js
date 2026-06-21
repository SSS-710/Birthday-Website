/* ============================================================
   app.js — Express Application Factory
   ============================================================ */

'use strict';

require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const compression    = require('compression');
const mongoSanitize  = require('express-mongo-sanitize');
const xss            = require('xss');

const authRoutes     = require('./routes/auth.routes');
const messageRoutes  = require('./routes/message.routes');
const userRoutes     = require('./routes/user.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

/* ── Security Headers ──────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/* ── CORS ──────────────────────────────────────────────────── */
const allowedOrigins = [
  // Origins from .env (production / staging URLs)
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Always allow Live Server origins in development
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Body Parsing ──────────────────────────────────────────── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ── Data Sanitisation ─────────────────────────────────────── */
app.use(mongoSanitize());   // prevent NoSQL injection

/* ── Compression ───────────────────────────────────────────── */
app.use(compression());

/* ── HTTP Logging (dev only) ───────────────────────────────── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ── Global Rate Limiter ───────────────────────────────────── */
app.use('/api', apiLimiter);

/* ── Health Check ──────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    message: 'The Unknown Man API is alive ✦',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

/* ── API Routes ────────────────────────────────────────────── */
app.use('/api/auth',     authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users',    userRoutes);

/* ── 404 & Error Handlers ──────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;

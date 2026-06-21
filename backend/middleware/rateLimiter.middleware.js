/* ============================================================
   middleware/rateLimiter.middleware.js — Rate Limiting
   ============================================================ */

'use strict';

const rateLimit = require('express-rate-limit');

const windowMs   = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const maxGlobal  = parseInt(process.env.RATE_LIMIT_MAX)       || 100;
const maxLogin   = parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

/* ── General API limiter ────────────────────────────────────── */
const apiLimiter = rateLimit({
  windowMs,
  max:       maxGlobal,
  message: {
    success: false,
    message: 'Too many requests — please try again later.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1',
});

/* ── Strict login limiter ───────────────────────────────────── */
const loginLimiter = rateLimit({
  windowMs,
  max:       maxLogin,
  message: {
    success: false,
    message: `Too many login attempts — please try again in ${windowMs / 60000} minutes.`,
  },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,   // only count failures
});

module.exports = { apiLimiter, loginLimiter };

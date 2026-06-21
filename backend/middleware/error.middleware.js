/* ============================================================
   middleware/error.middleware.js — Centralised Error Handling
   ============================================================ */

'use strict';

const logger = require('../utils/logger');

/* ── Custom Error Class ─────────────────────────────────────── */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status     = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/* ── 404 Not Found Handler ──────────────────────────────────── */
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

/* ── Mongoose CastError ─────────────────────────────────────── */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

/* ── Mongoose Duplicate Key ─────────────────────────────────── */
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field: ${field}`, 409);
};

/* ── Mongoose Validation Error ──────────────────────────────── */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 422);
};

/* ── Global Error Handler ───────────────────────────────────── */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message };

  // Mongoose errors → operational AppErrors
  if (err.name === 'CastError')         error = handleCastError(err);
  if (err.code  === 11000)              error = handleDuplicateKey(err);
  if (err.name === 'ValidationError')   error = handleValidationError(err);

  const statusCode = error.statusCode || 500;
  const message    = error.isOperational ? error.message : 'Internal server error';

  // Log 5xx errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    status:  error.status || 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      raw:   err,
    }),
  });
};

module.exports = { AppError, notFound, errorHandler };

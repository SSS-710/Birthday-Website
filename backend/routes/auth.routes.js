/* ============================================================
   routes/auth.routes.js
   ============================================================ */

'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');

const { login, getMe, refreshToken, logout } = require('../controllers/auth.controller');
const { protect }      = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiter.middleware');

const router = Router();

/* ── Validation rules ──────────────────────────────────────── */
const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be alphanumeric'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

/* ── Routes ─────────────────────────────────────────────────── */
router.post('/login',   loginLimiter, loginRules, validate, login);
router.get( '/me',      protect, getMe);
router.post('/refresh', protect, refreshToken);
router.post('/logout',  protect, logout);

module.exports = router;

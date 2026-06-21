/* ============================================================
   routes/message.routes.js
   ============================================================ */

'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');

const {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  markSeen,
} = require('../controllers/message.controller');

const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

// All message routes require authentication
router.use(protect);

/* ── Validation chains ─────────────────────────────────────── */
const sendRules = [
  body('receiverId')
    .notEmpty().withMessage('receiverId is required')
    .isMongoId().withMessage('receiverId must be a valid ID'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

const editRules = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
];

const seenRules = [
  body('messageIds')
    .isArray({ min: 1 }).withMessage('messageIds must be a non-empty array')
    .custom((ids) => ids.every((id) => /^[a-f\d]{24}$/i.test(id)))
    .withMessage('Each messageId must be a valid MongoDB ObjectId'),
];

/* ── Routes ─────────────────────────────────────────────────── */
router.get('/',        paginationRules, validate, getMessages);
router.post('/',       sendRules,       validate, sendMessage);
router.put('/seen',    seenRules,       validate, markSeen);
router.put('/:id',     editRules,       validate, editMessage);
router.delete('/:id',
  [param('id').isMongoId().withMessage('Invalid message ID')],
  validate,
  deleteMessage
);

module.exports = router;

/* ============================================================
   routes/user.routes.js
   ============================================================ */

'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');

const { getUsers, getUserById, updateAvatar } = require('../controllers/user.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(protect);

/* ── Routes ─────────────────────────────────────────────────── */
router.get('/', getUsers);

router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  getUserById
);

router.put('/avatar',
  [body('avatar').trim().notEmpty().withMessage('Avatar emoji is required')],
  validate,
  updateAvatar
);

module.exports = router;

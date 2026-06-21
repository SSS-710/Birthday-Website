/* ============================================================
   middleware/validate.middleware.js — Request Validation
   ============================================================ */

'use strict';

const { validationResult } = require('express-validator');

/**
 * validate — runs after express-validator chains.
 * Returns 422 with structured errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field:   e.path,
    message: e.msg,
    value:   e.value,
  }));

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors:  formatted,
  });
};

module.exports = { validate };

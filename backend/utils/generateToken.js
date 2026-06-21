/* ============================================================
   utils/generateToken.js — JWT Token Generator
   ============================================================ */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * generateToken — signs a JWT for the given user ID.
 * @param {string} id  — MongoDB user _id
 * @returns {string}   — signed JWT string
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;

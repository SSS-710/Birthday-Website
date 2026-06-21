/* ============================================================
   config/db.js — MongoDB Atlas Connection
   ============================================================ */

'use strict';

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 uses these by default, but explicit is better
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected — attempting reconnect…');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

  } catch (err) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

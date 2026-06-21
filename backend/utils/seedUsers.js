'use strict';

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('./logger');

const USERS = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    displayName: 'The Unknown Man',
    password: process.env.ADMIN_PASSWORD || 'AdminSecurePass2026!',
    role: 'admin',
    avatar: '🌙'
  },
  {
    username: process.env.BHUMIKA_USERNAME || 'bhumika',
    displayName: 'Bhumika 💕',
    password: process.env.BHUMIKA_PASSWORD || 'BhumikaSecure2026!',
    role: 'user',
    avatar: '🌸'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    logger.info('✅ Connected to MongoDB for seeding');

    for (const data of USERS) {
      const exists = await User.findOne({ username: data.username });

      if (exists) {
        logger.warn(`User ${data.username} already exists`);
        continue;
      }

      await User.create(data);
      logger.info(`Created ${data.username}`);
    }

    logger.info('Seeding complete');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
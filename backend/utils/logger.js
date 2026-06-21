/* ============================================================
   utils/logger.js — Structured Console Logger
   ============================================================ */

'use strict';

const isDev = process.env.NODE_ENV !== 'production';

const colours = {
  reset:  '\x1b[0m',
  info:   '\x1b[36m',   // cyan
  warn:   '\x1b[33m',   // yellow
  error:  '\x1b[31m',   // red
  debug:  '\x1b[35m',   // magenta
};

const timestamp = () => new Date().toISOString();

const logger = {
  info:  (...args) => console.log(`${colours.info}[${timestamp()}] INFO${colours.reset}`, ...args),
  warn:  (...args) => console.warn(`${colours.warn}[${timestamp()}] WARN${colours.reset}`, ...args),
  error: (...args) => console.error(`${colours.error}[${timestamp()}] ERROR${colours.reset}`, ...args),
  debug: (...args) => {
    if (isDev) console.log(`${colours.debug}[${timestamp()}] DEBUG${colours.reset}`, ...args);
  },
};

module.exports = logger;

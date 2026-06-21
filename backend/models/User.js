/* ============================================================
   models/User.js — User Schema
   Two fixed users only: admin + bhumika
   ============================================================ */

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },

    displayName: {
      type:     String,
      required: [true, 'Display name is required'],
      trim:     true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },

    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:   false,   // never returned in queries by default
    },

    role: {
      type:    String,
      enum:    ['admin', 'user'],
      default: 'user',
    },

    avatar: {
      type:    String,
      default: '💝',
    },

    isOnline: {
      type:    Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    socketId: {
      type:    String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ── Hash password before save ─────────────────────────────── */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

/* ── Instance method: compare password ─────────────────────── */
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/* ── Instance method: safe public object ───────────────────── */
UserSchema.methods.toPublicJSON = function () {
  return {
    _id:         this._id,
    username:    this.username,
    displayName: this.displayName,
    role:        this.role,
    avatar:      this.avatar,
    isOnline:    this.isOnline,
    lastSeen:    this.lastSeen,
    createdAt:   this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);

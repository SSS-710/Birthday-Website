/* ============================================================
   models/Message.js — Chat Message Schema
   ============================================================ */

'use strict';

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
      index:    true,
    },

    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Receiver is required'],
      index:    true,
    },

    message: {
      type:      String,
      required:  [true, 'Message content is required'],
      trim:      true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    seen: {
      type:    Boolean,
      default: false,
    },

    seenAt: {
      type:    Date,
      default: null,
    },

    edited: {
      type:    Boolean,
      default: false,
    },

    editedAt: {
      type:    Date,
      default: null,
    },

    deleted: {
      type:    Boolean,
      default: false,
    },

    deletedAt: {
      type:    Date,
      default: null,
    },

    // For future emoji reactions
    reactions: [
      {
        emoji:  { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,   // adds createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        // Show deleted messages as placeholder
        if (ret.deleted) {
          ret.message = '🚫 This message was deleted';
        }
        return ret;
      },
    },
  }
);

/* ── Compound index for fetching conversation ───────────────── */
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);

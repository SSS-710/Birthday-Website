/* ============================================================
   models/Photo.js — Photo / Memory Schema (future use)
   ============================================================ */

'use strict';

const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    url: {
      type:     String,
      required: [true, 'Photo URL is required'],
      trim:     true,
    },

    caption: {
      type:     String,
      trim:     true,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
      default:   '',
    },

    date: {
      type:    String,
      trim:    true,
      default: '',
    },

    order: {
      type:    Number,
      default: 0,
    },

    isVisible: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  }
);

PhotoSchema.index({ order: 1 });

module.exports = mongoose.model('Photo', PhotoSchema);

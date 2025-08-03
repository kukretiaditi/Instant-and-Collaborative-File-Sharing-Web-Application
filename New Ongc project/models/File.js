const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  shareId: {
    type: String,
    default: uuidv4
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  folder: {
    type: String,
    default: '/'
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  versions: [
    {
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  expiresAt: {
    type: Date
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Set expiry for anonymous files (24 hours)
FileSchema.pre('save', function(next) {
  if (this.isAnonymous && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('File', FileSchema); 
const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true,
    unique: true
  },

  // App Preferences
  appPreferences: {
    theme: {
      type: String,
      enum: ['Light', 'Dark'],
      default: 'Light'
    },
    profileVisibility: {
      type: String,
      enum: ['Public', 'Private'],
      default: 'Public'
    },
    searchHistory: {
      type: Boolean,
      default: true
    }
  },

  // Notifications
  notifications: {
    all: { type: Boolean, default: true },
    candidateUpdates: { type: Boolean, default: false },
    personalMessages: { type: Boolean, default: false },
    recommendations: { type: Boolean, default: false },
    candidateAccepted: { type: Boolean, default: false },
    candidateRejected: { type: Boolean, default: false }
  },

  // Security
  email: String,
  phone: String
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);

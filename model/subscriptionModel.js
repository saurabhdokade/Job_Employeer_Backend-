const mongoose = require('mongoose');

// Define Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe', // Handle both Agent and Builder
    required: true
  },
  planName: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium'],
    required: true
  },
  price: {
    type: Number,
    enum: [99, 299, 499], // 🎯 Added Enum for Price
    required: true
  },
  postLimit: {
    type: Number, // Number of properties allowed based on the plan
  },
  status: {
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// 🎯 Automatically choose plan and property limit based on price
subscriptionSchema.pre('save', function (next) {
  switch (this.price) {
    case 99:
      this.planName = 'Basic';
      this.postLimit = 10;
      break;
    case 299:
      this.planName = 'Standard';
      this.postLimit = 50;
      break;
    case 499:
      this.planName = 'Premium';
      this.postLimit = 100;
      break;
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

const mongoose = require('mongoose');

const paymentCardSchema = new mongoose.Schema({
  cardHolderName: {
    type: String,
    required: true
  },
  cardNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  cvv: {
    type: String, // or Number, but string is safer for leading 0s
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentCard', paymentCardSchema);

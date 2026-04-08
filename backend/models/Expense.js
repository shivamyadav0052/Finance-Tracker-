const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Rent', 'Shopping', 'Transport', 'Health', 'Entertainment', 'Education', 'Travel', 'Utilities', 'Other']
  },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet']
  },
  notes: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

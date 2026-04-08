const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Rent', 'Shopping', 'Transport', 'Health', 'Entertainment', 'Education', 'Travel', 'Utilities', 'Other']
  },
  month: { type: String, required: true }, // "2024-03"
  limit: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);

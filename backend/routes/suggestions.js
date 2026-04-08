const router = require('express').Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// POST /api/suggestions  — fetch AI suggestions from Python service
router.get('/', async (req, res) => {
  try {
    // Get last 30 days of expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).lean();

    const expenseData = expenses.map(e => ({
      amount: e.amount,
      category: e.category,
      date: e.date.toISOString().slice(0, 10),
      paymentMethod: e.paymentMethod
    }));

    // Try calling Python service
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${pythonUrl}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: expenseData }),
        signal: AbortSignal.timeout(5000)
      });
      const data = await response.json();
      return res.json(data);
    } catch (pyErr) {
      // Fallback: generate simple suggestions in Node.js if Python is down
      const suggestions = generateFallbackSuggestions(expenseData);
      return res.json({ suggestions, source: 'fallback' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateFallbackSuggestions(expenses) {
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const suggestions = [];

  if (sorted[0]) {
    suggestions.push({
      type: 'warning',
      message: `You spent the most on ${sorted[0][0]} (₹${sorted[0][1].toFixed(0)}) in the last 30 days. Consider reducing it by 15%.`
    });
  }
  if (sorted[1]) {
    suggestions.push({
      type: 'info',
      message: `${sorted[1][0]} is your second highest category at ₹${sorted[1][1].toFixed(0)}.`
    });
  }
  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
  if (total > 0) {
    suggestions.push({
      type: 'tip',
      message: `You've spent ₹${total.toFixed(0)} in the last 30 days. Try setting a monthly budget to stay on track!`
    });
  }

  return suggestions;
}

module.exports = router;

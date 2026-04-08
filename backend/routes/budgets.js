const router = require('express').Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/budgets?month=2024-03
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const budgets = await Budget.find({ user: req.user._id, month });

    // Get spending per category for the month
    const [year, m] = month.split('-');
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendingMap = {};
    spending.forEach(s => { spendingMap[s._id] = s.total; });

    const result = budgets.map(b => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      percentage: b.limit > 0 ? ((spendingMap[b.category] || 0) / b.limit * 100).toFixed(1) : 0,
      alert: b.limit > 0
        ? (spendingMap[b.category] || 0) >= b.limit
          ? 'exceeded'
          : (spendingMap[b.category] || 0) >= b.limit * 0.8
            ? 'warning'
            : 'ok'
        : 'ok'
    }));

    res.json({ budgets: result, month });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets
router.post('/', async (req, res) => {
  try {
    const { category, month, limit } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month },
      { limit },
      { upsert: true, new: true }
    );
    res.status(201).json({ budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Budget removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

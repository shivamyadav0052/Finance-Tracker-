const router = require('express').Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const userId = req.user._id;

    // Total spent this month
    const totalAgg = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSpent = totalAgg[0]?.total || 0;

    // Category breakdown (pie chart)
    const categoryBreakdown = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Top category
    const topCategory = categoryBreakdown[0] || null;

    // Top 3 payment methods
    const paymentMethods = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // Daily spending for line graph (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySpending = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent expenses
    const recentExpenses = await Expense.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      totalSpent,
      topCategory,
      categoryBreakdown,
      paymentMethods,
      dailySpending,
      recentExpenses,
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

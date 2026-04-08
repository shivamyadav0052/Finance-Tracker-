const router = require('express').Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/users — all users with total spending
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');

    const spending = await Expense.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ]);

    const spendingMap = {};
    spending.forEach(s => { spendingMap[s._id.toString()] = s; });

    const result = users.map(u => ({
      ...u.toObject(),
      totalSpent: spendingMap[u._id.toString()]?.totalSpent || 0,
      expenseCount: spendingMap[u._id.toString()]?.expenseCount || 0
    }));

    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalExpenses = await Expense.countDocuments();
    const totalSpentAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSpent = totalSpentAgg[0]?.total || 0;

    const topCategories = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({ totalUsers, totalExpenses, totalSpent, topCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const router = require("express").Router();
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const { protect } = require("../middleware/auth");
const { saveMonthlyReport, getMonthlyReports } = require("../config/sqlite");

router.use(protect);

// Helper: generate and save monthly report
async function generateMonthlyReport(userId, month) {
  const [year, m] = month.split("-");
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 0, 23, 59, 59);

  const expenses = await Expense.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  });
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const catMap = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });
  const topCategory =
    Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  const budgets = await Budget.find({ user: userId, month });
  const overbudgetCategories = budgets
    .filter((b) => (catMap[b.category] || 0) >= b.limit)
    .map((b) => b.category);

  const reportData = {
    totalSpent,
    topCategory,
    categoryBreakdown: catMap,
    overbudgetCategories,
  };

  await saveMonthlyReport({
    user_id: userId.toString(),
    month,
    total_spent: totalSpent,
    top_category: topCategory,
    overbudget_categories: overbudgetCategories,
    report_data: reportData,
  });

  return reportData;
}

// GET /api/reports/monthly  — last 3 months from local report store
router.get("/monthly", async (req, res) => {
  try {
    // Ensure current month report is up to date
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    await generateMonthlyReport(req.user._id, currentMonth);

    const rows = getMonthlyReports(req.user._id.toString(), 3);
    res.json({ reports: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/generate  — manually trigger report
router.post("/generate", async (req, res) => {
  try {
    const month = req.body.month || new Date().toISOString().slice(0, 7);
    const report = await generateMonthlyReport(req.user._id, month);
    res.json({ message: "Report generated", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

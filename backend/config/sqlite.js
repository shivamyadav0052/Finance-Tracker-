const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "../finance_reports.json");
let reports = [];

const loadReports = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify({ monthly_reports: [] }, null, 2),
      );
    }

    const fileContents = fs.readFileSync(DB_FILE, "utf8");
    const parsed = fileContents
      ? JSON.parse(fileContents)
      : { monthly_reports: [] };
    reports = Array.isArray(parsed.monthly_reports)
      ? parsed.monthly_reports
      : [];
  } catch (err) {
    console.error("Failed to load report store:", err);
    reports = [];
  }
};

const saveReports = () => {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ monthly_reports: reports }, null, 2),
  );
};

const initSQLite = () => {
  loadReports();
  console.log(" Report store initialized");
};

const saveMonthlyReport = (report) => {
  const existingIndex = reports.findIndex(
    (r) => r.user_id === report.user_id && r.month === report.month,
  );

  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.push(report);
  }

  saveReports();
};

const getMonthlyReports = (userId, limit = 3) => {
  return reports
    .filter((r) => r.user_id === userId)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, limit);
};

module.exports = {
  initSQLite,
  saveMonthlyReport,
  getMonthlyReports,
};

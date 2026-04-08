/**
 * Seed script — creates demo users and sample expenses
 * Run: node seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Expense = require("./models/Expense");
const Budget = require("./models/Budget");

const CATEGORIES = [
  "Food",
  "Rent",
  "Shopping",
  "Transport",
  "Health",
  "Entertainment",
  "Education",
  "Travel",
  "Utilities",
  "Other",
];
const PAYMENT_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Net Banking",
  "Wallet",
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dateInLastNDays(n) {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(0, n));
  return d;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clean up existing demo data
  await User.deleteMany({
    email: { $in: ["user@example.com", "admin@example.com"] },
  });

  // Create users
  const user = await User.create({
    name: "Demo User",
    email: "user@example.com",
    password: "Test@1234",
  });
  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: "Admin@1234",
    role: "admin",
  });
  console.log(" Users created");

  // Clean their old data
  await Expense.deleteMany({ user: user._id });
  await Budget.deleteMany({ user: user._id });

  // Create expenses
  const expenses = [];
  for (let i = 0; i < 60; i++) {
    const cat = randomFrom(CATEGORIES);
    const amounts = {
      Food: [150, 800],
      Rent: [5000, 15000],
      Shopping: [300, 3000],
      Transport: [50, 500],
      Health: [200, 2000],
      Entertainment: [200, 1500],
      Education: [500, 5000],
      Travel: [1000, 8000],
      Utilities: [200, 1500],
      Other: [100, 1000],
    };
    const [min, max] = amounts[cat];
    expenses.push({
      user: user._id,
      amount: randomBetween(min, max),
      category: cat,
      date: dateInLastNDays(60),
      paymentMethod: randomFrom(PAYMENT_METHODS),
      notes: `Sample ${cat.toLowerCase()} expense`,
    });
  }
  await Expense.insertMany(expenses);
  console.log("60 sample expenses created");

  // Create budgets for current month
  const month = new Date().toISOString().slice(0, 7);
  const budgets = [
    { category: "Food", limit: 5000 },
    { category: "Shopping", limit: 3000 },
    { category: "Transport", limit: 2000 },
    { category: "Entertainment", limit: 2000 },
    { category: "Utilities", limit: 1500 },
    { category: "Health", limit: 3000 },
  ];
  for (const b of budgets) {
    await Budget.create({ user: user._id, month, ...b });
  }
  console.log(" Budgets created");

  console.log("\n🎉 Seed complete!");
  console.log("Login: user@example.com / Test@1234");
  console.log("Admin: admin@example.com / Admin@1234");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

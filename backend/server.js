const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const { initSQLite } = require("./config/sqlite");

dotenv.config();

const envExamplePath = path.join(__dirname, ".env.example");
if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  if (fs.existsSync(envExamplePath)) {
    const exampleEnv = fs.readFileSync(envExamplePath, "utf8");
    exampleEnv.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key] && value !== undefined) {
          process.env[key] = value.trim();
        }
      }
    });
  }
}

const app = express();

// Connect databases
connectDB();
initSQLite();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/suggestions", require("./routes/suggestions"));

app.get("/", (req, res) =>
  res.json({ message: "Finance Tracker API Running " }),
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

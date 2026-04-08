const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../.env") });

const getMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const examplePath = path.join(__dirname, "../.env.example");
  if (!fs.existsSync(examplePath)) {
    return undefined;
  }

  const contents = fs.readFileSync(examplePath, "utf8");
  const match = contents.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m);
  return match ? match[1].trim() : undefined;
};

const connectDB = async () => {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    console.error(
      "MongoDB connection error: MONGODB_URI is not defined. Create a .env file from .env.example and set MONGODB_URI.",
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

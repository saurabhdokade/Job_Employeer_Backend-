const app = require("./app");
const http = require("http");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
const cors = require("cors");

// Load environment variables
dotenv.config({ path: "./config/config.env" });

// Connect to Database
connectDatabase();

// Create HTTP Server
const server = http.createServer(app);

// Load and log the PORT
console.log("Loaded PORT from env:", process.env.PORT);
const PORT = process.env.PORT || 5000;

// Start the Server
server.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});

// Handle Unexpected Errors
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  server.close(() => process.exit(1));
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("👋 Gracefully shutting down...");
  server.close(() => process.exit(0));
});

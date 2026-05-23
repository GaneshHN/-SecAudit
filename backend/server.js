const express = require("express");
const cors = require("cors");
const scanRoutes = require("./routes/scanRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", scanRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SecAudit DevSecOps Scanner", uptime: process.uptime() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`\n  SecAudit Backend running on http://localhost:${PORT}`);
  console.log(`  POST /api/scan — Submit a repo URL or ZIP for scanning`);
  console.log(`  GET  /health   — Health check\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`⚠️  Port ${PORT} is busy, trying ${+PORT + 1}...`);
    server.listen(+PORT + 1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

module.exports = app;

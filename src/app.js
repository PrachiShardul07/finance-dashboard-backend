require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const authRoutes        = require("./routes/auth");
const userRoutes        = require("./routes/users");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes   = require("./routes/dashboard");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard",    dashboardRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Finance Dashboard API running on http://localhost:${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;

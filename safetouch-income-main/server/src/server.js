import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import plansRoutes from "./routes/plans.js";
import dashboardRoutes from "./routes/dashboard.js";
import monitoringRoutes from "./routes/monitoring.js";
import aiRoutes from "./routes/ai.js";
import claimsRoutes from "./routes/claims.js";
import walletRoutes from "./routes/wallet.js";
import analyticsRoutes from "./routes/analytics.js";
import rewardsRoutes from "./routes/rewards.js";
import securityRoutes from "./routes/security.js";
import statsRoutes from "./routes/stats.js";
import notificationsRoutes from "./routes/notifications.js";
import activityRoutes from "./routes/activity.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "SafeRide AI API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/activity", activityRoutes);

app.use(errorHandler);

await connectDb();

app.listen(PORT, () => {
  console.log(`SafeRide AI API listening on http://localhost:${PORT}`);
});

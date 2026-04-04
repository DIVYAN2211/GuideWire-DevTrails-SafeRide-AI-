import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildDashboard } from "../services/dashboardService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const data = await buildDashboard(req.userId, req.query);
    if (!data) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, dashboard: data });
  } catch (e) {
    next(e);
  }
});

export default router;

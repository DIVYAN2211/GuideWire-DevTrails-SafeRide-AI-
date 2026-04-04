import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildAnalytics } from "../services/analyticsService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const analytics = await buildAnalytics(req.userId);
    res.json({ success: true, analytics });
  } catch (e) {
    next(e);
  }
});

export default router;

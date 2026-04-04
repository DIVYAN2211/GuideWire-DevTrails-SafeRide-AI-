import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildStats } from "../services/statsService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const stats = await buildStats(req.userId);
    if (!stats) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, ...stats });
  } catch (e) {
    next(e);
  }
});

export default router;

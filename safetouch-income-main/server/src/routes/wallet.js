import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { walletSnapshot } from "../services/analyticsService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const w = await walletSnapshot(req.userId);
    if (!w) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, wallet: w });
  } catch (e) {
    next(e);
  }
});

export default router;

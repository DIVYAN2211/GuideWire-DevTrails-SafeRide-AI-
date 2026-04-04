import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { logUserActivity } from "../services/gamificationService.js";

const router = Router();

router.post("/log", requireAuth, async (req, res, next) => {
  try {
    const data = await logUserActivity(req.userId, req.body || {});
    if (!data) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
});

export default router;

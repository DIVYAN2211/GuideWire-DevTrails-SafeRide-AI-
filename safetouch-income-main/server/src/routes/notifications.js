import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildSmartNotifications } from "../services/notificationService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const data = await buildSmartNotifications(req.userId, req.query);
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
});

export default router;

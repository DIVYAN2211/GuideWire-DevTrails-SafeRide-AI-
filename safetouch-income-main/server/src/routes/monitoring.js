import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildMonitoring } from "../services/monitoringService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const data = await buildMonitoring(req.userId, req.query);
    res.json({ success: true, monitoring: data });
  } catch (e) {
    next(e);
  }
});

export default router;

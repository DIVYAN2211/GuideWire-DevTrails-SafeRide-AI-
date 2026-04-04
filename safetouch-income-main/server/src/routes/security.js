import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  buildSecurityOverview,
  buildSecurityStatus,
  touchSimulatedDelivery,
  recordHeartbeat,
} from "../services/fraudService.js";

const router = Router();

/** Dynamic fraud / trust payload (pass ?lat=&lon= for GPS check) */
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const status = await buildSecurityStatus(req.userId, req.query);
    if (!status) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, ...status });
  } catch (e) {
    next(e);
  }
});

router.post("/heartbeat", requireAuth, async (req, res, next) => {
  try {
    const r = await recordHeartbeat(req.userId, req.body || {});
    res.json({ success: true, ...r });
  } catch (e) {
    next(e);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const security = await buildSecurityOverview(req.userId);
    if (!security) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, security });
  } catch (e) {
    next(e);
  }
});

/** Optional: bump simulated delivery count for demos */
router.post("/simulate-delivery", requireAuth, async (req, res, next) => {
  try {
    const r = await touchSimulatedDelivery(req.userId);
    res.json({ success: true, ...r });
  } catch (e) {
    next(e);
  }
});

export default router;

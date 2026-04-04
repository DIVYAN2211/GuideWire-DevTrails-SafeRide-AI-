import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  buildRewardsStatus,
  checkInStreak,
  claimGamificationReward,
} from "../services/gamificationService.js";

const router = Router();

async function sendStatus(req, res, next) {
  try {
    const data = await buildRewardsStatus(req.userId);
    if (!data) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

router.get("/status", requireAuth, sendStatus);

router.get("/", requireAuth, sendStatus);

router.post("/check-in", requireAuth, async (req, res, next) => {
  try {
    const data = await checkInStreak(req.userId);
    if (!data) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
});

router.post("/claim", requireAuth, async (req, res, next) => {
  try {
    const key = req.body?.key;
    if (!key || typeof key !== "string") {
      return res.status(400).json({ success: false, error: "key required" });
    }
    const result = await claimGamificationReward(req.userId, key);
    if (!result.ok) {
      return res.status(400).json({ success: false, error: result.error });
    }
    const status = await buildRewardsStatus(req.userId);
    res.json({
      success: true,
      claimed: result.reward,
      ...status,
      events: {
        newBadges: [],
        newRewards: [],
        streakMilestone: null,
        streakBroken: false,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;

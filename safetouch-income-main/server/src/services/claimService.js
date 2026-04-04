import { Claim } from "../models/Claim.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import {
  PAYOUT_AMOUNTS,
  THRESHOLDS,
  DUPLICATE_CLAIM_COOLDOWN_MS,
} from "../constants/plans.js";
import { getActiveSubscription } from "./subscriptionService.js";
import { syncBadges, evaluateRewardUnlocks } from "./streakRewardsService.js";
import { formatClaimExplanation } from "./claimExplanationService.js";

async function recentDuplicate(userId, type) {
  const since = new Date(Date.now() - DUPLICATE_CLAIM_COOLDOWN_MS);
  return Claim.findOne({ userId, type, createdAt: { $gte: since } });
}

/**
 * Zero-touch claims: requires active subscription to credit wallet.
 * Duplicate same type within cooldown → rejected_duplicate, trust adjusted.
 */
export async function evaluateZeroTouchClaims(userId, weather, options = {}) {
  const simulateCurfew = options.simulateCurfew === true;
  const user = await User.findById(userId);
  if (!user) return { triggered: [], skipped: "user_not_found" };

  const sub = await getActiveSubscription(userId);
  const results = [];

  const tryTrigger = async (type, conditionMet, triggeredValue, thresholdStr) => {
    if (!conditionMet) return;

    const dup = await recentDuplicate(userId, type);
    if (dup) {
      user.fraudFlags = (user.fraudFlags || 0) + 1;
      await user.save();
      await ActivityLog.create({
        userId,
        event: "duplicate_claim_prevented",
        ok: true,
        meta: { type },
      });
      results.push({
        type,
        status: "rejected_duplicate",
        message: "Duplicate claim prevented within cooldown",
      });
      return;
    }

    if (!sub) {
      results.push({
        type,
        status: "skipped_no_active_plan",
        message: "Activate a plan to receive auto payouts",
      });
      return;
    }

    const amount = Math.min(
      PAYOUT_AMOUNTS[type] ?? 0,
      sub.coverageAmount ?? PAYOUT_AMOUNTS[type]
    );

    const claim = await Claim.create({
      userId,
      type,
      amount,
      status: "credited",
      triggeredValue,
      threshold: thresholdStr,
      weatherSnapshot: {
        rainfallMm1h: weather.rainfallMm1h,
        temperatureC: weather.temperatureC,
        aqi: weather.aqi,
      },
    });

    if (!user.lastClaimByType) user.lastClaimByType = {};
    user.lastClaimByType[type] = new Date();
    await user.save();

    await Transaction.create({
      userId,
      type: "CLAIM",
      amount,
      claimId: claim._id,
      description: `Claim payout: ${type}`,
      meta: { threshold: thresholdStr, triggeredValue },
    });

    await ActivityLog.create({
      userId,
      event: "claim_auto_credited",
      ok: true,
      meta: { type, amount },
    });

    await syncBadges(userId);
    await evaluateRewardUnlocks(userId);

    results.push({
      type,
      status: "credited",
      amount,
      claimId: claim._id,
      explanation: formatClaimExplanation(claim),
    });
  };

  await tryTrigger(
    "rainfall",
    weather.rainfallMm1h > THRESHOLDS.rainfallMm,
    String(weather.rainfallMm1h),
    `>${THRESHOLDS.rainfallMm}mm`
  );

  await tryTrigger(
    "temperature",
    weather.temperatureC > THRESHOLDS.temperatureC,
    String(weather.temperatureC),
    `>${THRESHOLDS.temperatureC}°C`
  );

  await tryTrigger(
    "aqi",
    weather.aqi > THRESHOLDS.aqi,
    String(weather.aqi),
    `>${THRESHOLDS.aqi}`
  );

  await tryTrigger(
    "curfew",
    simulateCurfew,
    "simulated",
    "curfew_active"
  );

  return { triggered: results };
}

export async function getActiveClaimBanner(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const c = await Claim.findOne({
    userId,
    status: "credited",
    createdAt: { $gte: oneHourAgo },
  }).sort({ createdAt: -1 });
  return c;
}

import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Claim } from "../models/Claim.js";
import { Transaction } from "../models/Transaction.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { getActiveSubscription } from "./subscriptionService.js";

export function utcDayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function addUtcDaysKey(dayKey, delta) {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export const BADGE_DEFS = [
  { key: "starter", label: "Starter", description: "Welcome — you joined SafeRide" },
  { key: "consistent_rider", label: "Consistent Rider", description: "3+ day activity streak" },
  { key: "reliable_earner", label: "Reliable Earner", description: "5+ claim payouts completed" },
  { key: "protected_pro", label: "Protected Pro", description: "10+ claims with an active plan" },
  { key: "streak_master", label: "Streak Master", description: "7+ day activity streak" },
];

const REWARD_KEYS = {
  STREAK_7: "reward_streak_7_free_week",
  NO_CLAIMS_14: "reward_no_claims_14d_discount",
  TEN_CLAIMS: "reward_ten_claims_bonus_100",
};

function hasReward(user, key) {
  return (user.gamificationRewards || []).some((r) => r.key === key);
}

function snapshotBadgeKeys(user) {
  return new Set((user.badges || []).map((b) => b.key));
}

function snapshotRewardKeys(user) {
  return new Set((user.gamificationRewards || []).map((r) => r.key));
}

/**
 * Count credited claims for badge/reward rules.
 */
async function creditedClaimCount(userId) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  return Claim.countDocuments({ userId: uid, status: "credited" });
}

/**
 * Log once per UTC calendar day. Updates streak, activityDays, lastActiveDayKey.
 */
export async function logUserActivity(userId, body = {}) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid);
  if (!user) return null;

  const beforeBadges = snapshotBadgeKeys(user);
  const beforeRewards = snapshotRewardKeys(user);

  const now = new Date();
  const todayKey = utcDayKey(now);
  const prevKey = user.lastActiveDayKey || null;

  const events = {
    newBadges: [],
    newRewards: [],
    streakMilestone: null,
    streakBroken: false,
  };

  if (prevKey === todayKey) {
    await syncBadges(uid);
    await evaluateRewardUnlocks(uid);
    const status = await buildRewardsStatus(uid);
    return {
      ...status,
      events: {
        newBadges: [],
        newRewards: [],
        streakMilestone: null,
        streakBroken: false,
      },
    };
  }

  const yesterdayKey = addUtcDaysKey(todayKey, -1);

  if (!prevKey) {
    user.streak.current = 1;
  } else if (prevKey === yesterdayKey) {
    user.streak.current = (user.streak.current || 0) + 1;
  } else {
    if ((user.streak.current || 0) > 0) events.streakBroken = true;
    user.streak.current = 1;
  }

  user.streak.longest = Math.max(user.streak.longest || 0, user.streak.current);
  user.streak.lastCheckIn = now;
  user.lastActiveDayKey = todayKey;

  const daySet = new Set([...(user.activityDays || []), todayKey]);
  user.activityDays = [...daySet].sort().slice(-120);

  await ActivityLog.create({
    userId: uid,
    event: "daily_activity",
    ok: true,
    meta: { dayKey: todayKey, source: body.source || "app" },
  });

  if ([3, 5, 7, 14, 30].includes(user.streak.current)) {
    events.streakMilestone = user.streak.current;
  }

  await user.save();
  await syncBadges(uid);
  await evaluateRewardUnlocks(uid);

  const refreshed = await User.findById(uid).lean();
  for (const b of refreshed.badges || []) {
    if (!beforeBadges.has(b.key)) {
      const def = BADGE_DEFS.find((d) => d.key === b.key);
      events.newBadges.push({
        key: b.key,
        label: def?.label || b.key,
        description: def?.description || "",
        unlockedAt: b.earnedAt ? new Date(b.earnedAt).toISOString() : null,
      });
    }
  }
  for (const r of refreshed.gamificationRewards || []) {
    if (!beforeRewards.has(r.key)) {
      events.newRewards.push({
        key: r.key,
        type: r.type,
        description: r.description,
        achievedAt: r.achievedAt ? new Date(r.achievedAt).toISOString() : null,
      });
    }
  }

  const status = await buildRewardsStatus(uid);
  return { ...status, events };
}

export async function syncBadges(userId) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid);
  if (!user) return [];

  const earned = new Set((user.badges || []).map((b) => b.key));
  const add = (key) => {
    if (!earned.has(key)) {
      user.badges.push({ key, earnedAt: new Date() });
      earned.add(key);
    }
  };

  add("starter");

  const cur = user.streak?.current || 0;
  const longest = user.streak?.longest || 0;
  if (cur >= 3 || longest >= 3) add("consistent_rider");
  if (cur >= 7 || longest >= 7) add("streak_master");

  const nClaims = await creditedClaimCount(uid);
  if (nClaims >= 5) add("reliable_earner");

  const sub = await getActiveSubscription(uid);
  if (nClaims >= 10 && sub) add("protected_pro");

  await user.save();

  return BADGE_DEFS.map((b) => {
    const row = (user.badges || []).find((x) => x.key === b.key);
    return {
      key: b.key,
      badgeName: b.label,
      label: b.label,
      description: b.description,
      unlocked: earned.has(b.key),
      unlockedAt: row?.earnedAt ? new Date(row.earnedAt).toISOString() : null,
    };
  });
}

export async function evaluateRewardUnlocks(userId) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid);
  if (!user) return;

  if (!user.gamificationRewards) user.gamificationRewards = [];

  const streak = user.streak?.current || 0;
  if (streak >= 7 && !hasReward(user, REWARD_KEYS.STREAK_7)) {
    user.gamificationRewards.push({
      key: REWARD_KEYS.STREAK_7,
      type: "FREE_WEEK_INSURANCE",
      description: "1 week FREE insurance — 7-day activity streak",
      claimed: false,
      achievedAt: new Date(),
    });
  }

  const nClaims = await creditedClaimCount(uid);
  if (nClaims >= 10 && !hasReward(user, REWARD_KEYS.TEN_CLAIMS)) {
    user.gamificationRewards.push({
      key: REWARD_KEYS.TEN_CLAIMS,
      type: "BONUS_PAYOUT",
      description: "Bonus payout ₹100 — 10 claim payouts completed",
      claimed: false,
      achievedAt: new Date(),
      amountInr: 100,
    });
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const claimsLast14d = await Claim.countDocuments({
    userId: uid,
    createdAt: { $gte: since },
  });
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  if (
    claimsLast14d === 0 &&
    accountAgeMs >= 14 * 24 * 60 * 60 * 1000 &&
    !hasReward(user, REWARD_KEYS.NO_CLAIMS_14)
  ) {
    user.gamificationRewards.push({
      key: REWARD_KEYS.NO_CLAIMS_14,
      type: "PLAN_DISCOUNT",
      description: "Discount on next plan — no claims in the last 14 days",
      claimed: false,
      achievedAt: new Date(),
    });
  }

  await user.save();
}

export async function buildRewardsStatus(userId) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid).lean();
  if (!user) return null;

  const badges = await syncBadges(uid);
  await evaluateRewardUnlocks(uid);
  const u2 = await User.findById(uid).lean();

  const todayKey = utcDayKey(new Date());
  const needsActivityToday = u2.lastActiveDayKey !== todayKey;

  const streakCurrent = u2.streak?.current ?? 0;
  const daysToSeven = streakCurrent >= 7 ? 0 : Math.max(0, 7 - streakCurrent);

  const rewards = (u2.gamificationRewards || []).map((r) => ({
    key: r.key,
    type: r.type,
    description: r.description,
    claimed: r.claimed,
    date: r.achievedAt ? new Date(r.achievedAt).toISOString() : null,
    amountInr: r.amountInr ?? null,
  }));

  return {
    currentStreak: streakCurrent,
    longestStreak: u2.streak?.longest ?? 0,
    lastActiveDate: u2.lastActiveDayKey || null,
    activityDays: u2.activityDays || [],
    badges,
    rewards,
    progress: {
      nextStreakRewardDays: daysToSeven,
      nextStreakRewardLabel: "7-day streak → 1 week FREE insurance",
      message:
        daysToSeven > 0
          ? `${daysToSeven} more day${daysToSeven === 1 ? "" : "s"} to unlock streak reward`
          : "Streak reward unlocked — see Rewards below",
    },
    reminder: needsActivityToday
      ? "Complete today's activity to maintain your streak!"
      : null,
    rewardsSummary: getRewardsSummary(u2),
  };
}

/** Dashboard compact list */
export function getRewardsSummary(user) {
  const rows = user?.gamificationRewards || [];
  if (rows.length === 0) {
    return [
      {
        id: "hint_streak",
        text: "7-day streak → 1 week FREE insurance",
        unlocked: false,
      },
      {
        id: "hint_claims",
        text: "10 claims → Bonus ₹100",
        unlocked: false,
      },
    ];
  }
  return rows.slice(-5).map((r) => ({
    id: r.key,
    text: r.description,
    unlocked: true,
    claimed: r.claimed,
  }));
}

/**
 * Claim a bonus payout reward (credits wallet via Transaction).
 */
export async function claimGamificationReward(userId, key) {
  const uid =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid);
  if (!user) return { ok: false, error: "User not found" };

  const r = (user.gamificationRewards || []).find((x) => x.key === key);
  if (!r) return { ok: false, error: "Reward not found" };
  if (r.claimed) return { ok: false, error: "Already claimed" };

  if (r.type === "BONUS_PAYOUT" && r.amountInr > 0) {
    await Transaction.create({
      userId: uid,
      type: "adjustment",
      amount: r.amountInr,
      description: "Gamification bonus — 10 claims milestone",
    });
  }

  r.claimed = true;
  await user.save();
  return { ok: true, reward: r };
}

/** Back-compat alias */
export async function checkInStreak(userId) {
  return logUserActivity(userId, { source: "check_in" });
}

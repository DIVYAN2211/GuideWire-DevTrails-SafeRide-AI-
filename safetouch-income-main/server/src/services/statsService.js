import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import { CLAIM_TX_TYPES, computeLedgerSummary } from "./accountLedgerService.js";

function toObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function monthNameYear(d) {
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

/**
 * Stats from CLAIM transactions only (+ subscription dates for coverage).
 */
export async function buildStats(userId) {
  const uid = toObjectId(userId);
  const user = await User.findById(uid).lean();
  if (!user) return null;

  const claimMatch = { userId: uid, type: { $in: CLAIM_TX_TYPES } };
  const [claimTxs, subs, ledger] = await Promise.all([
    Transaction.find(claimMatch).sort({ createdAt: -1 }).lean(),
    Subscription.find({ userId: uid }).lean(),
    computeLedgerSummary(userId),
  ]);

  const totalProtected = claimTxs.reduce((s, t) => s + (t.amount || 0), 0);
  const totalClaims = claimTxs.length;
  const avgPayout = totalClaims ? Math.round(totalProtected / totalClaims) : 0;

  const now = new Date();
  const windowMs = 28 * 24 * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);
  const accountStart = new Date(user.createdAt);
  const effectiveStart = accountStart > windowStart ? accountStart : windowStart;
  const totalWorkingDays = Math.min(
    28,
    Math.max(1, Math.ceil((now - effectiveStart) / (24 * 60 * 60 * 1000)))
  );

  const protectedDays = new Set();
  for (const tx of claimTxs) {
    if (tx.createdAt >= windowStart) protectedDays.add(dayKey(tx.createdAt));
  }
  for (const sub of subs) {
    const start = new Date(Math.max(new Date(sub.startedAt), windowStart));
    const end = new Date(Math.min(new Date(sub.expiresAt), now));
    if (start > end) continue;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);
    while (d <= endDay) {
      protectedDays.add(dayKey(d));
      d.setDate(d.getDate() + 1);
    }
  }

  const coverageRate = Math.min(
    100,
    Math.round((protectedDays.size / totalWorkingDays) * 100)
  );

  const weeklyCoverage = [];
  for (let i = 3; i >= 0; i -= 1) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const inWeek = claimTxs.filter(
      (t) => t.createdAt >= start && t.createdAt < end
    );
    const claimAmount = inWeek.reduce((s, t) => s + (t.amount || 0), 0);
    weeklyCoverage.push({
      week: `W${4 - i}`,
      covered: inWeek.length > 0,
      claimAmount,
    });
  }

  const monthlyEarnings = {};
  const lookbackMonths = 12;
  for (let i = lookbackMonths - 1; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const key = monthNameYear(monthDate);
    const amount = claimTxs
      .filter((t) => t.createdAt >= monthDate && t.createdAt < nextMonth)
      .reduce((s, t) => s + (t.amount || 0), 0);
    monthlyEarnings[key] = amount;
  }

  const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSum = claimTxs
    .filter((t) => t.createdAt >= d15)
    .reduce((s, t) => s + t.amount, 0);
  const priorSum = claimTxs
    .filter((t) => t.createdAt >= d30 && t.createdAt < d15)
    .reduce((s, t) => s + t.amount, 0);
  const recentGrowthPct =
    priorSum > 0 ? Math.round(((recentSum - priorSum) / priorSum) * 100) : recentSum > 0 ? 100 : 0;

  let bestMonth = null;
  let bestAmount = -1;
  for (const [k, v] of Object.entries(monthlyEarnings)) {
    if (v > bestAmount) {
      bestAmount = v;
      bestMonth = k;
    }
  }
  if (bestAmount <= 0) bestMonth = null;

  return {
    totalProtected,
    totalClaims,
    avgPayout,
    coverageRate,
    weeklyCoverage,
    monthlyEarnings,
    ledger: {
      walletBalance: ledger.walletBalance,
      premiumPaid: ledger.premiumPaid,
      netBenefit: ledger.netBenefit,
    },
    trends: {
      recentGrowthPct,
      totalProtectedPrev30d: priorSum,
      totalProtectedLast15d: recentSum,
    },
    bestMonth,
  };
}

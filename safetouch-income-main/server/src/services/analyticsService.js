import { Claim } from "../models/Claim.js";
import { getActiveSubscription } from "./subscriptionService.js";
import {
  computeLedgerSummary,
  listRecentTransactions,
} from "./accountLedgerService.js";
import { User } from "../models/User.js";

export async function buildAnalytics(userId) {
  const claims = await Claim.find({ userId, status: "credited" }).sort({
    createdAt: -1,
  });
  const claimCount = claims.length;
  const ledger = await computeLedgerSummary(userId);
  const totalPayout = ledger.totalClaims;
  const avgPayout = claimCount ? Math.round(totalPayout / claimCount) : 0;

  const sub = await getActiveSubscription(userId);
  const baseRate = sub ? 78 : 40;
  const coverageRate = Math.min(100, baseRate + Math.min(claimCount, 8) * 2);

  const now = new Date();
  const weekly = [];
  for (let i = 3; i >= 0; i -= 1) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const wClaims = claims.filter(
      (c) => c.createdAt >= start && c.createdAt < end
    );
    const amount = wClaims.reduce((s, c) => s + c.amount, 0);
    weekly.push({
      week: `W${4 - i}`,
      covered: wClaims.length > 0 || !!sub,
      amount,
    });
  }

  const monthly = [];
  for (let i = 2; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const amount = claims
      .filter((c) => c.createdAt >= monthDate && c.createdAt < nextMonth)
      .reduce((s, c) => s + c.amount, 0);
    monthly.push({
      month: monthDate.toLocaleString("en-IN", { month: "long" }),
      earningsProtectedInr: amount,
    });
  }

  const totalProtectedDisplay =
    (sub?.coverageAmount ?? 0) + totalPayout;

  return {
    totalProtectedEarningsInr: totalProtectedDisplay,
    totalClaims: claimCount,
    coverageRate,
    avgPayoutInr: avgPayout,
    weekly,
    monthlyEarningsProtected: monthly,
    ledger: {
      walletBalance: ledger.walletBalance,
      premiumPaid: ledger.premiumPaid,
      netBenefit: ledger.netBenefit,
    },
  };
}

/**
 * Wallet / account view: all monetary fields from Transaction aggregates only.
 */
export async function walletSnapshot(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const ledger = await computeLedgerSummary(userId);
  const transactions = await listRecentTransactions(userId, 40);
  const sub = await getActiveSubscription(userId);

  return {
    walletBalance: ledger.walletBalance,
    totalClaims: ledger.totalClaims,
    premiumPaid: ledger.premiumPaid,
    netBenefit: ledger.netBenefit,
    transactions,
    userName: user.name,
    phone: user.phone,
    activePlan: sub
      ? {
          planKey: sub.planKey,
          weeklyPrice: sub.weeklyPrice,
          coverageAmount: sub.coverageAmount,
          expiresAt: sub.expiresAt,
          isFreeWeek: sub.isFreeWeek,
        }
      : null,
  };
}

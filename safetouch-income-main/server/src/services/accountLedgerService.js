import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";

/** Legacy types kept for existing DB rows */
export const CLAIM_TX_TYPES = ["CLAIM", "payout"];
/** Credits that increase wallet (claims + gamification bonuses) */
export const WALLET_CREDIT_TYPES = ["CLAIM", "payout", "adjustment"];
export const PLAN_TX_TYPES = ["PLAN_PAYMENT", "premium"];

function toObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

/**
 * All balances derived from Transaction collection only (no cached User totals).
 */
export async function computeLedgerSummary(userId) {
  const uid = toObjectId(userId);

  const [claimAgg, planAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: uid, type: { $in: WALLET_CREDIT_TYPES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: uid, type: { $in: PLAN_TX_TYPES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const walletBalance = claimAgg[0]?.total ?? 0;
  const premiumPaid = planAgg[0]?.total ?? 0;
  const totalClaims = walletBalance;
  const netBenefit = totalClaims - premiumPaid;

  return {
    walletBalance,
    totalClaims,
    premiumPaid,
    netBenefit,
  };
}

export async function listRecentTransactions(userId, limit = 40) {
  const uid = toObjectId(userId);
  const rows = await Transaction.find({ userId: uid })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((t) => ({
    id: t._id,
    type: normalizeTxTypeForApi(t.type),
    amount: t.amount,
    date: t.createdAt,
    description: t.description || "",
    claimId: t.claimId,
  }));
}

/** Normalize legacy DB values for API */
export function normalizeTxTypeForApi(type) {
  if (type === "payout") return "CLAIM";
  if (type === "premium") return "PLAN_PAYMENT";
  return type;
}

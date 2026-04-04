import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Claim } from "../models/Claim.js";
import { Transaction } from "../models/Transaction.js";
import { getActiveClaimBanner } from "../services/claimService.js";
import {
  computeLedgerSummary,
  normalizeTxTypeForApi,
} from "../services/accountLedgerService.js";
import { formatClaimExplanation } from "../services/claimExplanationService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.userId;

    const [history, txs, activeBanner, ledger] = await Promise.all([
      Claim.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      getActiveClaimBanner(userId),
      computeLedgerSummary(userId),
    ]);

    const credited = history.filter((c) => c.status === "credited");
    const claimById = new Map(history.map((c) => [String(c._id), c]));

    const active = activeBanner
      ? {
          id: activeBanner._id,
          type: activeBanner.type,
          amount: activeBanner.amount,
          triggeredValue: activeBanner.triggeredValue,
          threshold: activeBanner.threshold,
          explanation: formatClaimExplanation(activeBanner),
          creditedAt: activeBanner.creditedAt,
        }
      : null;

    res.json({
      success: true,
      activeClaim: active,
      claims: history.map((c) => ({
        id: c._id,
        type: c.type,
        amount: c.amount,
        status: c.status,
        triggeredValue: c.triggeredValue,
        threshold: c.threshold,
        explanation: c.status === "credited" ? formatClaimExplanation(c) : null,
        createdAt: c.createdAt,
        creditedAt: c.creditedAt,
      })),
      transactions: txs.map((t) => {
        const row = {
          id: t._id,
          type: normalizeTxTypeForApi(t.type),
          amount: t.amount,
          description: t.description,
          claimId: t.claimId,
          date: t.createdAt,
        };
        if (t.claimId) {
          const linked = claimById.get(String(t.claimId));
          if (linked && linked.status === "credited") {
            row.explanation = formatClaimExplanation(linked);
          }
        }
        return row;
      }),
      summary: {
        claimEventCount: credited.length,
        walletBalance: ledger.walletBalance,
        totalClaims: ledger.totalClaims,
        premiumPaid: ledger.premiumPaid,
        netBenefit: ledger.netBenefit,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;

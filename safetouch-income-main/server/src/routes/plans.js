import { Router } from "express";
import { PLAN_CATALOG, PLAN_BY_KEY } from "../constants/plans.js";
import { Subscription } from "../models/Subscription.js";
import { Transaction } from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { weeklyMs } from "../services/subscriptionService.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ success: true, plans: PLAN_CATALOG });
});

router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    const { planKey, paymentMethod = "upi", freeFirstWeek = false } = req.body;
    const plan = PLAN_BY_KEY[planKey];
    if (!plan) {
      throw new HttpError(400, "Invalid planKey (basic | standard | pro)");
    }

    const pm = ["upi", "card"].includes(paymentMethod) ? paymentMethod : "upi";
    const isFree = Boolean(freeFirstWeek);
    const weeklyPrice = isFree ? 0 : plan.weeklyPrice;
    const storedMethod = isFree ? "free_week" : pm;

    await Subscription.updateMany(
      { userId: req.userId, status: "active" },
      { $set: { status: "cancelled" } }
    );

    const expiresAt = new Date(Date.now() + weeklyMs());
    const sub = await Subscription.create({
      userId: req.userId,
      planKey: plan.key,
      weeklyPrice,
      coverageAmount: plan.coverage,
      status: "active",
      paymentMethod: storedMethod,
      isFreeWeek: isFree,
      expiresAt,
    });

    if (!isFree && weeklyPrice > 0) {
      await Transaction.create({
        userId: req.userId,
        type: "PLAN_PAYMENT",
        amount: weeklyPrice,
        description: `Plan payment — ${plan.name} (simulated ${pm})`,
      });
    }

    res.json({
      success: true,
      message: isFree
        ? "Free first week activated (simulated)."
        : "Payment successful (simulated). Plan active.",
      subscription: {
        id: sub._id,
        planKey: sub.planKey,
        weeklyPrice: sub.weeklyPrice,
        coverageAmount: sub.coverageAmount,
        paymentMethod: sub.paymentMethod,
        isFreeWeek: sub.isFreeWeek,
        expiresAt: sub.expiresAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;

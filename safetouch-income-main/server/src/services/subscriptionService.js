import { Subscription } from "../models/Subscription.js";

export async function getActiveSubscription(userId) {
  const now = new Date();
  return Subscription.findOne({
    userId,
    status: "active",
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 });
}

export function weeklyMs() {
  return 7 * 24 * 60 * 60 * 1000;
}

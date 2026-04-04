import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "Rider" },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastCheckIn: { type: Date, default: null },
    },
    badges: { type: [badgeSchema], default: [] },
    trustScore: { type: Number, default: 95, min: 0, max: 100 },
    locationVerified: { type: Boolean, default: true },
    deliveriesToday: { type: Number, default: 0 },
    /** Lifetime delivery completions (Security activity metric) */
    totalDeliveries: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: null },
    appUsageSecondsTotal: { type: Number, default: 0 },
    lastClaimByType: {
      rainfall: Date,
      temperature: Date,
      aqi: Date,
      curfew: Date,
    },
    fraudFlags: { type: Number, default: 0 },
    rewardMilestones: {
      freeWeekEarned: { type: Boolean, default: false },
      discountNextPlan: { type: Boolean, default: false },
    },
    /** UTC calendar day keys (YYYY-MM-DD) user had qualifying activity */
    activityDays: { type: [String], default: [] },
    lastActiveDayKey: { type: String, default: null },
    gamificationRewards: [
      {
        key: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String, required: true },
        claimed: { type: Boolean, default: false },
        achievedAt: { type: Date, default: Date.now },
        amountInr: { type: Number, default: null },
      },
    ],
    /** Saved at signup (browser geolocation) for OpenWeather */
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    locationUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planKey: {
      type: String,
      required: true,
      enum: ["basic", "standard", "pro"],
    },
    weeklyPrice: { type: Number, required: true },
    coverageAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "free_week"],
      default: "upi",
    },
    isFreeWeek: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

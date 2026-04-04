import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["CLAIM", "PLAN_PAYMENT", "payout", "premium", "adjustment"],
    },
    amount: { type: Number, required: true },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      default: null,
    },
    description: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);

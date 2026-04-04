import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
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
      enum: ["rainfall", "temperature", "aqi", "curfew"],
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["credited", "rejected_duplicate", "pending_review"],
      default: "credited",
    },
    triggeredValue: { type: String },
    threshold: { type: String },
    weatherSnapshot: { type: mongoose.Schema.Types.Mixed },
    creditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

claimSchema.index({ userId: 1, createdAt: -1 });

export const Claim = mongoose.model("Claim", claimSchema);

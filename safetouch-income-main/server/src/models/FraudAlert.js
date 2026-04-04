import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    code: { type: String, required: true, index: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
  },
  { timestamps: true }
);

fraudAlertSchema.index({ userId: 1, code: 1, createdAt: -1 });

export const FraudAlert = mongoose.model("FraudAlert", fraudAlertSchema);

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  creditsAdded: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Amount in dollars (not cents)
  },
  currency: {
    type: String,
    default: "usd",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  planId: {
    type: String,
    required: false,
    default:'unknown'
  },
  stripeSession: {
    type: Object,
    default: {},
  },
  source: {
    type: String,
    enum: ["webhook", "frontend"],
    default: "frontend",
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Object,
    default: {},
  },
}, {
  timestamps: true,
});

// Compound index for faster queries
paymentSchema.index({ clerkId: 1, processedAt: -1 });
paymentSchema.index({ sessionId: 1, status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
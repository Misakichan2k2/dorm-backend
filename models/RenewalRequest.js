import mongoose from "mongoose";

const renewalRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    renewalRequestId: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: ["unpaid", "pending", "approved", "rejected", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["Tiền mặt", "chuyển khoản", "-"],
      default: "-",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const RenewalRequestModel = mongoose.model(
  "RenewalRequest",
  renewalRequestSchema
);
export default RenewalRequestModel;

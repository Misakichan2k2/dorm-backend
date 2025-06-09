// models/ElectricInvoice.js
import mongoose from "mongoose";

const electricInvoiceSchema = new mongoose.Schema(
  {
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    electricId: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    oldIndex: { type: Number, required: true },
    newIndex: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Đã đóng", "Chưa đóng"],
      default: "Chưa đóng",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ElectricInvoice", electricInvoiceSchema);

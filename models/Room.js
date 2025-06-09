import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    room: { type: String, required: true },
    price: { type: Number, required: true },
    gender: { type: String, enum: ["Nam", "Nữ"], required: true },
    status: {
      type: String,
      enum: ["Mở", "Đóng", "Hỏng"],
      default: "Đóng",
    },
  },
  { timestamps: true }
);

const RoomModel = mongoose.model("Room", roomSchema);
export default RoomModel;

roomSchema.index({ building: 1, room: 1 }, { unique: true });

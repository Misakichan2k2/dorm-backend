import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["Khu nam", "Khu nữ"],
      required: true,
    },
    rooms: { type: Number, required: true },
    peoplePerRoom: { type: Number, required: true },
    damagedRooms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const BuildingModel = mongoose.model("Building", buildingSchema);
export default BuildingModel;

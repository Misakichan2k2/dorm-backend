import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: "Registration" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Đang ở", "Đã trả"],
      default: "Đang ở",
    },
  },
  { timestamps: true }
);

const StudentModel = mongoose.model("Student", studentSchema);
export default StudentModel;

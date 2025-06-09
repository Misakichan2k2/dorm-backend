import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Hỏng thiết bị", "Sự cố điện", "Sự cố nước", "Khác"],
      required: true,
    },
    image: {
      type: String,
      default:
        "https://pbs.twimg.com/profile_images/481865412657684481/Nl5wU0EL_400x400.jpeg",
    },

    status: {
      type: String,
      enum: ["Chờ xử lý", "Đang xử lý", "Đã xử lý", "Đã hủy"],
      default: "Chờ xử lý",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ReportModel = mongoose.model("Report", reportSchema);
export default ReportModel;

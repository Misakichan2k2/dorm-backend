import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Góp ý", "Khiếu nại", "Khen ngợi", "Khác"],
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const FeedbackModel = mongoose.model("Feedback", feedbackSchema);
export default FeedbackModel;

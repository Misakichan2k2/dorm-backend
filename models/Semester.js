import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    year: { type: String, required: true },
    term: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const SemesterModel = mongoose.model("Semester", semesterSchema);
export default SemesterModel;

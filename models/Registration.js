import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    registrationCode: { type: String, required: true },
    fullname: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ["Nam", "Nữ"], required: true },
    religion: { type: String },
    ethnicity: { type: String },
    identityNumber: { type: String, required: true },
    studentId: { type: String, required: true },
    course: { type: String, required: true },
    school: { type: String, required: true },
    class: { type: String, required: true },
    address: {
      provinceCode: { type: String },
      districtCode: { type: String },
      wardCode: { type: String },
      street: { type: String },
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    image: {
      type: String,
      default:
        "https://pbs.twimg.com/profile_images/481865412657684481/Nl5wU0EL_400x400.jpeg",
    },

    startDate: { type: Date },
    endDate: { type: Date },
    paymentMethod: {
      type: String,
      enum: ["Tiền mặt", "Chuyển khoản", "-"],
      default: "-",
    },

    status: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "approved",
        "rejected",
        "canceled",
        "refunded",
      ],
      default: "unpaid",
    },
    registerFormDetail: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const RegistrationModel = mongoose.model("Registration", registrationSchema);
export default RegistrationModel;

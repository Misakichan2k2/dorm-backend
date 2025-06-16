import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import buildingRoutes from "./routes/building.routes.js";
import roomRoutes from "./routes/room.routes.js";
import studentRoutes from "./routes/student.routes.js";
import electricInvoiceRoutes from "./routes/electricInvoice.routes.js";
import waterInvoiceRoutes from "./routes/waterInvoice.routes.js";
import ReportRoutes from "./routes/report.routes.js";
import FeedbackRoutes from "./routes/feedback.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import RenewalRoutes from "./routes/renewal.routes.js";
import { cancelExpiredRegistrations } from "./controllers/registrationController.js";
import { autoUpdateStudentStatuses } from "./controllers/studentController.js";

dotenv.config();
const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/uploads", express.static("uploads"));

connectDB();

// Chạy mỗi 60 phút
setInterval(() => {
  cancelExpiredRegistrations();
  autoUpdateStudentStatuses();
}, 60 * 60 * 1000);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/electric-invoices", electricInvoiceRoutes);
app.use("/api/water-invoices", waterInvoiceRoutes);
app.use("/api/reports", ReportRoutes);
app.use("/api/feedbacks", FeedbackRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/renewals", RenewalRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Error middleware:", err);
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    error: err, // Có thể giúp debug nếu đang phát triển
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

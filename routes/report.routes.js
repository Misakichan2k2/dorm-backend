import express from "express";
import {
  createReport,
  getAllReports,
  getMyReports,
  getReportById,
  updateReportStatusByAdmin,
  cancelMyReport,
  deleteReport,
  updateReport,
  getReportCategoryStats,
} from "../controllers/reportController.js";
import { verifyToken } from "../middlewares/verifyUser.js";
import upload from "../middlewares/uploadImage.js";

const router = express.Router();

// User
router.post("/", verifyToken, upload.single("image"), createReport);
router.get("/me", verifyToken, getMyReports);
router.put("/:id/cancel", verifyToken, cancelMyReport);

// Admin
router.get("/", getAllReports);
router.get("/statistics/category", getReportCategoryStats);
router.get("/:id", getReportById);
router.put("/:id", updateReport);
router.put("/:id/status", updateReportStatusByAdmin);
router.delete("/:id", deleteReport);

export default router;

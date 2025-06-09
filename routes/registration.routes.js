import express from "express";
import upload from "../middlewares/uploadImage.js";
import {
  createRegistration,
  getAllRegistrations,
  getMyProfile,
  checkMyRegistration,
  getRegistrationHistory,
  updateRegistrationStatus,
  getRegistrationById,
  updateRegisterFormDetail,
  updateRegistrationById,
  deleteRegistrationById,
  deleteUnapprovedRegistrations,
  updatePaymentMethod,
} from "../controllers/registrationController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

// Đăng ký phòng (chỉ dành cho user đã đăng nhập)
router.post("/", verifyToken, upload.single("image"), createRegistration);
router.get("/me", verifyToken, getMyProfile);
router.get("/hasRegistration", verifyToken, checkMyRegistration);
router.get("/history", verifyToken, getRegistrationHistory);
router.get("/", getAllRegistrations);
router.get("/:id", getRegistrationById);
router.put("/:id/status", updateRegistrationStatus);
router.put("/:id/register-form", updateRegisterFormDetail);
router.put("/:id", updateRegistrationById);
router.delete("/:id", deleteRegistrationById);
router.delete("/delete-unapproved", deleteUnapprovedRegistrations);
router.patch("/:id/payment-method", updatePaymentMethod);

export default router;

import express from "express";
import {
  createRenewalRequest,
  getAllRenewalRequests,
  getRenewalRequestById,
  updateRenewalRequestStatus,
  updateRenewalRequestNotes,
  updateRenewalRequest,
  deleteRenewalRequest,
  getRenewalRequestsByStatus,
  updatePaymentMethod,
} from "../controllers/renewalRequestController.js";

import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

// Renewal requests CRUD
router.post("/", verifyToken, createRenewalRequest);
router.get("/", getAllRenewalRequests);
router.get("/renewals", getRenewalRequestsByStatus);
router.get("/:id", getRenewalRequestById);
router.patch("/:id/status", updateRenewalRequestStatus);
router.put("/:id", updateRenewalRequest);
router.patch("/:id/note", updateRenewalRequestNotes);
router.delete("/:id", deleteRenewalRequest);
router.patch("/:id/payment-method", updatePaymentMethod);

export default router;

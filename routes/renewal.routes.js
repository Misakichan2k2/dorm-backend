import express from "express";
import {
  createRenewalRequest,
  getAllRenewalRequests,
  getRenewalRequestById,
  updateRenewalRequestStatus,
  updateRenewalRequestNotes,
  updateRenewalRequest,
  deleteRenewalRequest,
} from "../controllers/renewalRequestController.js";

import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

// Renewal requests CRUD
router.post("/", verifyToken, createRenewalRequest);
router.get("/", getAllRenewalRequests);
router.get("/:id", getRenewalRequestById);
router.patch("/:id/status", updateRenewalRequestStatus);
router.put("/:id", updateRenewalRequest);
router.patch("/:id/note", updateRenewalRequestNotes);
router.delete("/:id", deleteRenewalRequest);

export default router;

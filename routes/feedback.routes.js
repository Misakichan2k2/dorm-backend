import express from "express";
import {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackNote,
} from "../controllers/feedbackController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

router.post("/", verifyToken, createFeedback);
router.get("/", getAllFeedbacks);
router.get("/:id", getFeedbackById);
router.put("/:id/note", updateFeedbackNote);

export default router;

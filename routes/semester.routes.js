import express from "express";
import {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
} from "../controllers/semesterController.js";

const router = express.Router();

router.post("/", createSemester);
router.get("/", getAllSemesters);
router.get("/:id", getSemesterById);
router.put("/:id", updateSemester);
router.delete("/:id", deleteSemester);

export default router;

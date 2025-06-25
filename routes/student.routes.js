import express from "express";
import {
  getAllStudents,
  getStudentById,
  getMyStudentInfo,
  updateStudentStatus,
  getStudentHistory,
  getAllStudentRoomHistory,
  updateStudent,
  deleteStudentById,
  getRoomIncomeStats,
  isStudent,
  deleteStudentsWithoutRegistration,
  getAllStudentsDb,
} from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

// User
router.get("/me", verifyToken, getMyStudentInfo);
router.get("/is-student", verifyToken, isStudent);

// Admin
router.get("/", getAllStudents);
router.get("/students", getAllStudentsDb);
router.get("/room-history", getAllStudentRoomHistory);
router.get("/room-income", getRoomIncomeStats);
router.delete("/clean-unregistered", deleteStudentsWithoutRegistration);
router.get("/:id", getStudentById);
router.put("/:id/status", updateStudentStatus);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudentById);
router.get("/:id/room-history", getStudentHistory);

export default router;

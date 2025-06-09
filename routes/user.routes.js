import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  updateUserStatus,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/status", updateUserStatus);
router.patch("/:id/ban", banUser);

export default router;

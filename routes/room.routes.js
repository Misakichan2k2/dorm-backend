import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
} from "../controllers/roomController.js";

const router = express.Router();

router.post("/", createRoom);
router.get("/", getRooms);
router.get("/available", getAvailableRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;

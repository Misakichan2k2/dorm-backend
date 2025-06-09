import express from "express";
import {
  getMyRoomWaterInvoices,
  createWaterInvoice,
  getAllWaterInvoices,
  getWaterInvoiceById,
  updateWaterInvoice,
  deleteWaterInvoice,
} from "../controllers/waterInvoiceController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

router.get("/me", verifyToken, getMyRoomWaterInvoices);
router.post("/", createWaterInvoice);
router.get("/", getAllWaterInvoices);
router.get("/:id", getWaterInvoiceById);
router.put("/:id", updateWaterInvoice);
router.delete("/:id", deleteWaterInvoice);

export default router;

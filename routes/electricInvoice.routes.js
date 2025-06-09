import express from "express";
import {
  getMyRoomElectricInvoices,
  createElectricInvoice,
  getAllElectricInvoices,
  getElectricInvoiceById,
  updateElectricInvoice,
  deleteElectricInvoice,
  onGetInvoiceByRoomMonth,
} from "../controllers/electricInvoiceController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

router.get("/me", verifyToken, getMyRoomElectricInvoices);
router.post("/", createElectricInvoice);
router.get("/", getAllElectricInvoices);
router.get("/by-room-month", onGetInvoiceByRoomMonth);
router.get("/:id", getElectricInvoiceById);
router.put("/:id", updateElectricInvoice);
router.delete("/:id", deleteElectricInvoice);

export default router;

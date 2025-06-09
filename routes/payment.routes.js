import express from "express";
import {
  createElectricInvoicePaymentUrl,
  vnpayElectricReturn,
  createWaterInvoicePaymentUrl,
  vnpayWaterReturn,
  createRegistrationPaymentUrl,
  vnpayRegistrationReturn,
  createRenewalPaymentUrl,
  vnpayRenewalReturn,
} from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

router.post(
  "/create-electric-vnpay-payment",
  verifyToken,
  createElectricInvoicePaymentUrl
);
router.get("/electric-vnpay-return", vnpayElectricReturn);

router.post(
  "/create-water-vnpay-payment",
  verifyToken,
  createWaterInvoicePaymentUrl
);
router.get("/water-vnpay-return", vnpayWaterReturn);

router.post(
  "/create-registration-vnpay-payment",
  verifyToken,
  createRegistrationPaymentUrl
);
router.get("/registration-vnpay-return", vnpayRegistrationReturn);

router.post("/create_payment_url", verifyToken, createRenewalPaymentUrl);
router.get("/renewal-vnpay-return", vnpayRenewalReturn);

export default router;

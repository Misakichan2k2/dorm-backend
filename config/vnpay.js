import dotenv from "dotenv";
dotenv.config();

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

export default {
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",

  vnp_ElectricReturnUrl:
    "http://localhost:3000/api/payments/electric-vnpay-return",

  vnp_WaterReturnUrl: "http://localhost:3000/api/payments/water-vnpay-return",

  vnp_RegistrationReturnUrl:
    // "http://localhost:5173/room-info",
    "http://localhost:3000/api/payments/registration-vnpay-return",

  vnp_RenewalReturnUrl:
    "http://localhost:3000/api/payments/renewal-vnpay-return",

  paymentResultUrls: {
    invoice: `${FRONTEND_BASE_URL}/payment-result`,
    request: `${FRONTEND_BASE_URL}/payment-result-request`,
    renewal: `${FRONTEND_BASE_URL}/payment-result-renewal`,
  },
};

import express from "express";
import {
  signin,
  signOut,
  signup,
  adminSignup,
  adminSignin,
  changePassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyUser.js";

const router = express.Router();

// User
router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout", verifyToken, signOut);
router.put("/change-password", verifyToken, changePassword);

// Admin
router.post("/admin/signup", adminSignup);
router.post("/admin/signin", adminSignin);
export default router;

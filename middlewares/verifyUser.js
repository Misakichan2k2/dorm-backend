import { errorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(errorHandler(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return next(errorHandler(403, "Forbidden"));

    try {
      const user = await UserModel.findById(decoded.id); // Hoặc decoded._id tùy bạn tạo token thế nào
      if (!user) return next(errorHandler(404, "User not found"));

      if (!user.isEmailVerified) {
        return next(errorHandler(403, "Email chưa được xác thực"));
      }

      req.user = user;
      next();
    } catch (err) {
      next(errorHandler(500, "Server error"));
    }
  });
};

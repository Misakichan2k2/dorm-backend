import { errorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Lấy token từ Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(errorHandler(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1]; // Tách phần "Bearer" ra để lấy token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(errorHandler(403, "Forbidden"));
    req.user = user;
    next();
  });
};

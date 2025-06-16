import User from "../models/User.js";
import Admin from "../models/Admin.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// User
export const signup = async (req, res, next) => {
  const { fullname, email, password } = req.body;

  // Check if the email already exists
  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    console.log("Email already exists:", email); // Debug log
    return res.status(400).json({ message: "Email already exists!" });
  }

  // Find the last user and generate the next userId
  const lastUser = await User.findOne().sort({ userId: -1 });
  let newUserId = "US001"; // Default userId if no users exist

  if (lastUser) {
    const lastUserId = lastUser.userId;
    const lastNumber = parseInt(lastUserId.substring(2)); // Extract the number part
    const newNumber = lastNumber + 1; // Increment by 1
    newUserId = `US${newNumber.toString().padStart(3, "0")}`; // Format to 3 digits
  }

  // Hash the password
  const hashedPassword = bcryptjs.hashSync(password, 10);

  // Create a new user with the required fields and auto-generated userId
  const newUser = new User({
    fullname,
    email,
    password: hashedPassword,
    userId: newUserId, // Assign generated userId
  });

  try {
    // Save the new user
    await newUser.save();

    res.status(201).json("User created successfully!");
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const existedUser = await User.findOne({ email });
    if (!existedUser) {
      return next(errorHandler(404, "User not found!"));
    }

    const validPassword = bcryptjs.compareSync(password, existedUser.password);
    if (!validPassword) {
      return next(errorHandler(401, "Email hoặc mật khẩu không đúng!"));
    }

    // Kiểm tra nếu tài khoản bị khóa
    if (existedUser.status === "banned") {
      return next(errorHandler(403, "Tài khoản của bạn đã bị khóa."));
    }

    const token = jwt.sign({ id: existedUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = existedUser._doc;
    res.status(200).json({ ...rest, token });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra người dùng có tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "Người dùng không tồn tại."));
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = bcryptjs.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return next(errorHandler(401, "Mật khẩu hiện tại không đúng."));
    }

    // Hash mật khẩu mới
    const hashedPassword = bcryptjs.hashSync(newPassword, 10);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    next(error);
  }
};

// Admin
export const adminSignup = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Tạo admin mới
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json("Admin tạo thành công!");
  } catch (error) {
    next(error);
  }
};

export const adminSignin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const existedAdmin = await Admin.findOne({ email });
    if (!existedAdmin) {
      return next(errorHandler(404, "Admin not found!"));
    }

    const validPassword = bcryptjs.compareSync(password, existedAdmin.password);
    if (!validPassword) {
      return next(errorHandler(401, "Email hoặc mật khẩu không đúng!"));
    }

    const token = jwt.sign({ id: existedAdmin._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = existedAdmin._doc;
    res.status(200).json({ ...rest, token });
  } catch (error) {
    next(error);
  }
};

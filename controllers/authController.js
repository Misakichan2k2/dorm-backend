import User from "../models/User.js";
import Admin from "../models/Admin.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
dotenv.config();

// User
export const signup = async (req, res, next) => {
  const { fullname, email, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    // Tạo userId tự động
    const lastUser = await User.findOne().sort({ userId: -1 });
    let newUserId = "US001";
    if (lastUser) {
      const lastNumber = parseInt(lastUser.userId.substring(2));
      const newNumber = lastNumber + 1;
      newUserId = `US${newNumber.toString().padStart(3, "0")}`;
    }

    // Băm mật khẩu
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Tạo token xác thực email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1h

    // Tạo user mới
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      userId: newUserId,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expires,
    });

    await newUser.save();

    // Gửi email xác thực
    const verifyLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"KTX System" <${process.env.EMAIL_USER}>`,
      to: newUser.email,
      subject: "Xác thực email",
      html: `
        <h3>Xin chào ${newUser.fullname},</h3>
        <p>Vui lòng xác thực email bằng cách bấm vào link sau:</p>
        <a href="${verifyLink}">${verifyLink}</a>
        <p>Link này sẽ hết hạn sau 1 giờ.</p>
      `,
    });

    res.status(201).json({
      message: "Tạo tài khoản thành công. Vui lòng kiểm tra email để xác thực.",
    });
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

    // Kiểm tra mail đã đc xác thực
    if (!existedUser.isEmailVerified) {
      return next(
        errorHandler(
          403,
          "Email của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực."
        )
      );
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

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return next(errorHandler(400, "Thiếu token xác thực"));
    }

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return next(
        errorHandler(400, "Token không hợp lệ hoặc tài khoản không tồn tại")
      );
    }

    if (user.emailVerificationExpires < Date.now()) {
      return next(errorHandler(400, "Token đã hết hạn"));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email đã được xác thực thành công" });
  } catch (error) {
    next(errorHandler(500, "Lỗi xác thực email"));
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại." });
    }

    // Tạo token và thời hạn hết hạn
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 giờ

    await user.save();

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"KTX System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Đặt lại mật khẩu",
      html: `
        <h3>Xin chào ${user.fullname},</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết sau để thiết lập mật khẩu mới:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      `,
    });

    res.status(200).json({ message: "Email đặt lại mật khẩu đã được gửi." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    user.password = bcryptjs.hashSync(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công." });
  } catch (error) {
    next(error);
  }
};

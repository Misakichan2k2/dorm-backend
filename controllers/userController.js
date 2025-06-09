import User from "../models/User.js";
import mongoose from "mongoose";
import RegistrationModel from "../models/Registration.js";

// Lấy danh sách tất cả người dùng

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // Lấy thêm thông tin đăng ký cho từng user
    const usersWithRegistration = await Promise.all(
      users.map(async (user) => {
        const registration = await RegistrationModel.findOne({
          user: user._id,
        }).populate("room");
        return {
          ...user.toObject(),
          registration,
        };
      })
    );

    res.json(usersWithRegistration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid user ID" });

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const registration = await RegistrationModel.findOne({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("room");

    res.json({ ...user.toObject(), registration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid user ID" });

  try {
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa người dùng
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid user ID" });

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    user.status = "banned"; // Cố định trạng thái
    await user.save();

    res.status(200).json({ message: "Người dùng đã bị khóa (banned)" });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Kiểm tra ID hợp lệ
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Kiểm tra status hợp lệ
  const validStatuses = ["active", "banned", "deleted"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User status updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

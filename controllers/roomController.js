import Room from "../models/Room.js";
import Student from "../models/Student.js";
import Registration from "../models/Registration.js";
import { errorHandler } from "../utils/errorHandler.js";

export const createRoom = async (req, res, next) => {
  try {
    const { building, room } = req.body;

    const existingRoom = await Room.findOne({ building, room });
    if (existingRoom) {
      return res
        .status(400)
        .json({ message: "Phòng này đã tồn tại trong khu này." });
    }

    const newRoom = new Room(req.body);
    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách phòng
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find()
      .sort({ createdAt: -1 })
      .populate("building");

    const students = await Student.find({ status: "Đang ở" }).populate(
      "registration"
    );
    const registrations = await Registration.find({
      status: { $in: ["pending", "unpaid"] },
    });

    const results = await Promise.all(
      rooms.map((room) => {
        const rented = students.filter(
          (student) =>
            student.registration &&
            String(student.registration.room) === String(room._id)
        ).length;

        const registered = registrations.filter(
          (reg) =>
            reg.status === "pending" && String(reg.room) === String(room._id)
        ).length;

        const unpaid = registrations.filter(
          (reg) =>
            reg.status === "unpaid" && String(reg.room) === String(room._id)
        ).length;

        const peoplePerRoom = room.building?.peoplePerRoom ?? 0;
        const used = rented + registered + unpaid;
        const empty = Math.max(peoplePerRoom - used, 0);
        const total = used;

        return {
          ...room.toObject(),
          rented,
          registered,
          unpaid,
          empty,
          total,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách phòng chỉ với status === "Mở"
export const getAvailableRooms = async (req, res, next) => {
  try {
    // Lấy tất cả phòng có status = "Mở"
    const rooms = await Room.find({ status: "Mở" }).populate("building");

    // Lấy tất cả sinh viên có status "Đang ở" và populate registration
    const students = await Student.find({ status: "Đang ở" }).populate(
      "registration"
    );

    // Lấy tất cả đơn đăng ký có status là "pending" hoặc "unpaid"
    const registrations = await Registration.find({
      status: { $in: ["pending", "unpaid"] },
    });

    const results = rooms.map((room) => {
      // Đếm số sinh viên đang ở trong phòng này
      const rented = students.filter(
        (student) =>
          student.registration &&
          String(student.registration.room) === String(room._id)
      ).length;

      // Đếm số đơn đăng ký đang chờ duyệt trong phòng này
      const registered = registrations.filter(
        (reg) =>
          reg.status === "pending" && String(reg.room) === String(room._id)
      ).length;

      // Đếm số đơn đăng ký chưa thanh toán trong phòng này
      const unpaid = registrations.filter(
        (reg) =>
          reg.status === "unpaid" && String(reg.room) === String(room._id)
      ).length;

      const peoplePerRoom = room.building?.peoplePerRoom ?? 0;
      const used = rented + registered + unpaid;
      const empty = Math.max(peoplePerRoom - used, 0);
      const total = used;

      return {
        ...room.toObject(),
        rented,
        registered,
        unpaid,
        empty,
        total,
      };
    });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết phòng theo ID
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("building");
    if (!room) return next(errorHandler(404, "Room not found"));

    const rented = await Student.countDocuments({
      room: room._id,
      status: "Đang ở",
    });

    const registered = await Registration.countDocuments({
      room: room._id,
      status: "pending",
    });

    const unpaid = await Registration.countDocuments({
      room: room._id,
      status: "unpaid",
    });

    const peoplePerRoom = room.building?.peoplePerRoom ?? 0;
    const used = rented + registered + unpaid;
    const empty = Math.max(peoplePerRoom - used, 0);
    const total = rented + registered + unpaid;

    res.status(200).json({
      ...room.toObject(),
      rented,
      registered,
      unpaid,
      empty,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const { building, room } = req.body;

    // Kiểm tra nếu có phòng khác cùng building + room
    const existing = await Room.findOne({
      _id: { $ne: roomId }, // loại trừ chính phòng đang cập nhật
      building,
      room,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Phòng này đã tồn tại trong khu nhà." });
    }

    const updated = await Room.findByIdAndUpdate(roomId, req.body, {
      new: true,
    });

    if (!updated) return next(errorHandler(404, "Room not found"));

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted) return next(errorHandler(404, "Room not found"));

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
};

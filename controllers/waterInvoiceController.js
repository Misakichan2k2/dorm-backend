import WaterInvoice from "../models/WaterInvoice.js";
import StudentModel from "../models/Student.js";
import RoomModel from "../models/Room.js";

// User
// Get my water invoices
export const getMyRoomWaterInvoices = async (req, res) => {
  try {
    const students = await StudentModel.find({ user: req.user.id }).populate({
      path: "registration",
      select: "room",
      populate: {
        path: "room",
        select: "_id",
      },
    });

    const roomIds = students
      .map((s) => s.registration?.room?._id)
      .filter((id) => !!id);

    if (roomIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phòng nào của sinh viên." });
    }

    const invoices = await WaterInvoice.find({ room: { $in: roomIds } })
      .populate({
        path: "room",
        populate: { path: "building", select: "name" },
      })
      .sort({ year: -1, month: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin
export const createWaterInvoice = async (req, res) => {
  try {
    const { room, month, year, oldIndex, newIndex } = req.body;

    // Kiểm tra chỉ số
    if (newIndex <= oldIndex) {
      return res
        .status(400)
        .json({ error: "Chỉ số mới phải lớn hơn chỉ số cũ." });
    }

    // Kiểm tra trùng hóa đơn (theo phòng + tháng + năm)
    const existing = await WaterInvoice.findOne({ room, month, year });
    if (existing) {
      return res.status(400).json({
        error: "Hóa đơn nước cho phòng này trong tháng và năm đã tồn tại.",
      });
    }

    // Lấy thông tin phòng + building
    const roomDoc = await RoomModel.findById(room).populate("building", "name");
    if (!roomDoc) {
      return res.status(400).json({ error: "Không tìm thấy phòng." });
    }

    // Tạo mã hóa đơn nước
    const buildingCode = roomDoc.building.name.replace(/\s/g, "");
    const roomCode = roomDoc.room.replace(/\s/g, "");
    const datePart = `${year}${month.toString().padStart(2, "0")}`;
    const waterId = `WL${buildingCode}${roomCode}${datePart}`;

    // Tạo hóa đơn
    const invoice = await WaterInvoice.create({
      ...req.body,
      waterId,
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllWaterInvoices = async (req, res) => {
  try {
    const invoices = await WaterInvoice.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "room",
        populate: {
          path: "building",
          select: "name",
        },
      });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWaterInvoiceById = async (req, res) => {
  try {
    const invoice = await WaterInvoice.findById(req.params.id).populate({
      path: "room",
      populate: {
        path: "building",
        select: "name",
      },
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWaterInvoice = async (req, res) => {
  try {
    const invoice = await WaterInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWaterInvoice = async (req, res) => {
  try {
    await WaterInvoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/reportController.js
import ReportModel from "../models/Report.js";
import StudentModel from "../models/Student.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";

// Helper để generate reportId
const generateReportId = async () => {
  let newId = "";
  let exists = true;
  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000);
    newId = `RP${random}`;
    exists = await ReportModel.findOne({ reportId: newId });
  }
  return newId;
};

// CREATE - User tạo báo cáo
export const createReport = async (req, res, next) => {
  try {
    const student = await StudentModel.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    }

    const reportId = await generateReportId();

    let imageUrl = undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "report_images",
      });
      imageUrl = result.secure_url;
      await fs.unlink(req.file.path);
    }

    const newReport = new ReportModel({
      ...req.body,
      student: student._id,
      reportId,
      image: imageUrl || undefined,
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    next(error);
  }
};

// USER - Get all reports của phòng mình
// USER - Get all reports của chính mình
export const getMyReports = async (req, res, next) => {
  try {
    // Lấy tất cả studentId thuộc về user hiện tại
    const students = await StudentModel.find({ user: req.user.id });

    if (!students.length) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên nào." });
    }

    const studentIds = students.map((s) => s._id);

    // Lấy tất cả report liên quan đến các studentId của user này
    const reports = await ReportModel.find({
      student: { $in: studentIds },
    })
      .populate({ path: "student", populate: { path: "registration" } })
      .sort({ createdAt: -1 });

    const result = reports.map((report) => ({
      _id: report._id,
      reportId: report.reportId,
      creator: report.student.registration?.fullname || "N/A",
      title: report.title,
      description: report.description,
      category: report.category,
      image: report.image,
      status: report.status,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Get all reports
export const getAllReports = async (req, res, next) => {
  try {
    const reports = await ReportModel.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        populate: {
          path: "registration",
          populate: {
            path: "room",
            populate: { path: "building" },
          },
        },
      });

    const result = reports.map((report) => ({
      _id: report._id,
      reportId: report.reportId,
      creator: report.student.registration?.fullname || "N/A",
      studentId: report.student.registration?.studentId || "N/A",
      title: report.title,
      description: report.description,
      category: report.category,
      image: report.image,
      status: report.status,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      room: report.student.registration?.room?.room || "",
      building: report.student.registration?.room?.building?.name || "",
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Get report by ID
export const getReportById = async (req, res, next) => {
  try {
    const report = await ReportModel.findById(req.params.id).populate({
      path: "student",
      populate: [
        { path: "room", populate: { path: "building" } },
        { path: "registration" },
      ],
    });

    if (!report)
      return res.status(404).json({ message: "Không tìm thấy báo cáo." });

    res.status(200).json({
      _id: report._id,
      reportId: report.reportId,
      creator: report.student.registration?.fullname || "N/A",
      studentId: report.student.registration?.studentId || "N/A",
      title: report.title,
      description: report.description,
      category: report.category,
      image: report.image,
      status: report.status,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      room: report.student.registration?.room?.room || "",
      building: report.student.registration?.room?.building?.name || "",
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE - Admin cập nhật trạng thái bất kỳ
export const updateReportStatusByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateFields = { status };
    if (status === "Đã xử lý") {
      updateFields.completedAt = new Date();
    }

    const updated = await ReportModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy báo cáo." });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// UPDATE - User huỷ đơn (chỉ đổi sang 'Đã hủy')
export const cancelMyReport = async (req, res, next) => {
  try {
    const student = await StudentModel.findOne({ user: req.user.id });
    const report = await ReportModel.findOne({
      _id: req.params.id,
      student: student._id,
    });

    if (!report)
      return res
        .status(404)
        .json({ message: "Không tìm thấy báo cáo của bạn." });

    report.status = "Đã hủy";
    await report.save();

    res.status(200).json({ message: "Đã huỷ đơn thành công." });
  } catch (error) {
    next(error);
  }
};

// UPDATE - Full update (nếu cần)
export const updateReport = async (req, res, next) => {
  try {
    const updated = await ReportModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy báo cáo." });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteReport = async (req, res, next) => {
  try {
    const deleted = await ReportModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy báo cáo." });
    res.status(200).json({ message: "Đã xoá báo cáo." });
  } catch (error) {
    next(error);
  }
};

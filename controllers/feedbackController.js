import FeedbackModel from "../models/Feedback.js";
import StudentModel from "../models/Student.js";

export const createFeedback = async (req, res, next) => {
  try {
    const { title, content, type, note } = req.body;

    // Lấy student từ user đang đăng nhập
    const student = await StudentModel.findOne({ user: req.user.id });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin sinh viên." });
    }

    const feedback = await FeedbackModel.create({
      postedBy: student._id,
      title,
      content,
      type,
      note,
    });

    res
      .status(201)
      .json({ message: "Gửi phản hồi thành công.", data: feedback });
  } catch (error) {
    next(error);
  }
};

export const getAllFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await FeedbackModel.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "postedBy",
        populate: {
          path: "registration",
          select: "fullname studentId room",
          populate: {
            path: "room",
            select: "room building",
            populate: {
              path: "building",
              select: "name",
            },
          },
        },
      });

    const formatted = feedbacks.map((f) => ({
      _id: f._id,
      title: f.title,
      content: f.content,
      type: f.type,
      note: f.note,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      fullname: f.postedBy?.registration?.fullname,
      studentId: f.postedBy?.registration?.studentId,
      room: f.postedBy?.registration?.room?.room,
      building: f.postedBy?.registration?.room?.building?.name,
    }));

    res
      .status(200)
      .json({ message: "Lấy danh sách phản hồi thành công.", data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const f = await FeedbackModel.findById(id).populate({
      path: "postedBy",
      populate: {
        path: "registration",
        select: "fullname studentId room",
        populate: {
          path: "room",
          select: "room building",
          populate: {
            path: "building",
            select: "name",
          },
        },
      },
    });

    if (!f) {
      return res.status(404).json({ message: "Không tìm thấy phản hồi." });
    }

    res.status(200).json({
      message: "Lấy phản hồi thành công.",
      data: {
        _id: f._id,
        title: f.title,
        content: f.content,
        type: f.type,
        note: f.note,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        fullname: f.postedBy?.registration?.fullname,
        studentId: f.postedBy?.registration?.studentId,
        room: f.postedBy?.room?.room,
        building: f.postedBy?.room?.building?.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeedbackNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const feedback = await FeedbackModel.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: "Không tìm thấy phản hồi." });
    }

    feedback.note = note;
    await feedback.save();

    res.status(200).json({
      message: "Cập nhật ghi chú thành công.",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

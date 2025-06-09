import Registration from "../models/Registration.js";
import Room from "../models/Room.js";
import Student from "../models/Student.js";
import { generateUniqueRegistrationCode } from "../utils/generateRegistrationCode.js";
import { sendMail } from "../utils/registrationMailer.js";
import { format } from "date-fns";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";

const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return "Không xác định";
  return format(new Date(date), "dd/MM/yyyy");
};

// User
export const createRegistration = async (req, res, next) => {
  const {
    roomId,
    fullname,
    birthDate,
    gender,
    religion,
    ethnicity,
    identityNumber,
    studentId,
    course,
    school,
    class: studentClass,
    address,
    phone,
    email,
    month,
    year,
  } = req.body;

  try {
    // Kiểm tra đã có đơn chờ xử lý hoặc chưa thanh toán chưa
    const existingRequest = await Registration.findOne({
      user: req.user.id,
      status: { $in: ["pending", "unpaid"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "Bạn đang có 1 yêu cầu chờ phê duyệt hoặc chưa thanh toán, không thể tạo thêm yêu cầu mới!",
      });
    }

    // Lấy thông tin phòng và tòa
    const room = await Room.findById(roomId).populate("building");
    if (!room) {
      return res.status(400).json({ message: "Phòng không tồn tại!" });
    }

    const building = room.building;
    if (!building) {
      return res.status(400).json({ message: "Tòa nhà không tồn tại!" });
    }

    // Tính số người đã đăng ký (đang ở, pending, unpaid)
    const [rented, registered, unpaid] = await Promise.all([
      Student.countDocuments({ room: room._id, status: "đang ở" }),
      Registration.countDocuments({ room: room._id, status: "pending" }),
      Registration.countDocuments({ room: room._id, status: "unpaid" }),
    ]);

    const used = rented + registered + unpaid;
    const peoplePerRoom = building.peoplePerRoom ?? 0;
    const empty = Math.max(peoplePerRoom - used, 0);

    if (empty <= 0) {
      return res.status(400).json({ message: "Phòng này đã đầy!" });
    }

    // Tạo mã đăng ký duy nhất
    const registrationCode = await generateUniqueRegistrationCode();

    // Tính ngày bắt đầu và ngày kết thúc tháng đăng ký
    const startDate = new Date(year, month - 1, 1); // VD: 01/05/2025
    const endDate = new Date(year, month, 0); // VD: 31/05/2025

    // Xử lý ảnh (nếu có)
    let imageUrl = undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "registration_images",
      });
      imageUrl = result.secure_url;
      await fs.unlink(req.file.path); // xóa file local sau khi upload
    }

    // Tạo đơn đăng ký
    const registration = new Registration({
      room: roomId,
      user: req.user.id,
      registrationCode,
      fullname,
      birthDate,
      gender,
      religion,
      ethnicity,
      identityNumber,
      studentId,
      course,
      school,
      class: studentClass,
      address,
      phone,
      email,
      month,
      year,
      startDate,
      endDate,
      status: "unpaid",
      image: imageUrl,
    });

    await registration.save();

    res.status(201).json({
      message: "Đơn đăng ký phòng đã được tạo thành công!",
      registration,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin cá nhân theo đơn đăng ký
export const getMyProfile = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "room",
        populate: { path: "building" },
      })
      .populate("user");

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    }

    res.status(200).json({ data: registration.toObject() });
  } catch (error) {
    next(error);
  }
};

// Kiểm tra tài khoản hiện tại đã có đơn đăng ký chưa
export const checkMyRegistration = async (req, res, next) => {
  try {
    const existing = await Registration.findOne({
      user: req.user.id,
    });

    res.status(200).json({
      hasRegistration: !!existing,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách các đơn đã đăng ký của chính mình
export const getRegistrationHistory = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "room",
        populate: { path: "building" },
      });

    res.status(200).json({ registrations });
  } catch (error) {
    next(error);
  }
};

// Admin

// Lấy danh sách đơn đăng ký
export const getAllRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "room",
        populate: { path: "building" },
      })
      .populate("user");

    const fullData = registrations.map((item) => item.toObject());

    res.status(200).json({ data: fullData });
  } catch (error) {
    next(error);
  }
};

// Lấy đơn đăng ký theo ID
export const getRegistrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findById(id)
      .populate({
        path: "room",
        populate: { path: "building" },
      })
      .populate("user");

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    }

    res.status(200).json({ data: registration.toObject() });
  } catch (error) {
    next(error);
  }
};

// Cập nhật trạng thái đơn đăng ký
export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "unpaid",
      "pending",
      "approved",
      "rejected",
      "canceled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    const oldRegistration = await Registration.findById(id);
    if (!oldRegistration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    }

    let registerFormDetail = "";

    if (status === "approved") {
      registerFormDetail = `Đơn đăng ký phòng của bạn đã được duyệt. Thời gian thuê phòng bắt đầu từ ngày ${formatDate(
        oldRegistration.startDate
      )}. Vui lòng đến phòng quản lý ký túc xá để nhận chìa khóa.`;
    } else if (status === "rejected") {
      registerFormDetail =
        "Rất tiếc, đơn đăng ký phòng của bạn đã bị từ chối. Vui lòng kiểm tra thông tin chi tiết trên hệ thống hoặc liên hệ Ban Quản lý Ký túc xá để biết thêm chi tiết. Ngoài ra, bạn vui lòng đến phòng Quản lý Ký túc xá để nhận lại số tiền đã thanh toán.";
    } else if (status === "pending") {
      registerFormDetail =
        "Đơn đăng ký phòng của bạn đang chờ được xét duyệt. Vui lòng đợi hoặc liên hệ ban quản lý để biết thêm chi tiết.";
    } else if (status === "unpaid") {
      registerFormDetail =
        "Bạn chưa thanh toán. Vui lòng hoàn tất thanh toán trong vòng 24 giờ kể từ khi tạo đơn để đơn đăng ký không bị hủy.";
    } else if (status === "refunded") {
      registerFormDetail = `Việc hoàn trả tiền cho sinh viên đã được thực hiện thành công.`;
    } else {
      registerFormDetail = `Không xác định.`;
    }

    const updated = await Registration.findByIdAndUpdate(
      id,
      registerFormDetail ? { status, registerFormDetail } : { status },
      { new: true }
    ).populate({
      path: "room",
      populate: {
        path: "building",
        select: "name",
      },
    });

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    }

    // Gửi email nếu chuyển từ pending sang approved/rejected
    if (
      oldRegistration.status === "pending" &&
      (status === "approved" || status === "rejected")
    ) {
      const subject =
        status === "approved"
          ? "Đơn đăng ký phòng của bạn đã được duyệt"
          : "Đơn đăng ký phòng của bạn đã bị từ chối";

      const text = `Chào ${updated.fullname},\n\n${registerFormDetail}\n\nPhòng đăng ký: #${updated.registrationCode}\nPhòng: ${updated.room.room} - Khu: ${updated.room.building.name}\n\nTrân trọng,\nBan quản lý ký túc xá.`;

      await sendMail(updated.email, subject, text);
    }

    // Nếu đơn được duyệt thì tạo student nếu chưa có
    if (status === "approved") {
      const existedStudent = await Student.findOne({
        user: updated.user,
        registration: updated._id,
      });

      if (!existedStudent) {
        // Lấy startDate và endDate từ registration
        const { startDate, endDate } = updated;

        if (!startDate || !endDate) {
          return res.status(400).json({
            message:
              "Đơn đăng ký chưa có ngày bắt đầu hoặc kết thúc hợp lệ để tạo sinh viên.",
          });
        }

        await Student.create({
          user: updated.user,
          registration: updated._id,
          room: updated.room,
          startDate,
          endDate,
          status: "Đang ở",
        });
      }
    }

    res
      .status(200)
      .json({ message: "Cập nhật trạng thái thành công.", data: updated });
  } catch (error) {
    next(error);
  }
};

// Cập nhật registerFormDetail cho đơn đăng ký
export const updateRegisterFormDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { registerFormDetail } = req.body;

    if (!registerFormDetail || typeof registerFormDetail !== "string") {
      return res
        .status(400)
        .json({ message: "registerFormDetail không hợp lệ." });
    }

    const updated = await Registration.findByIdAndUpdate(
      id,
      { registerFormDetail },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    }

    res.status(200).json({
      message: "Cập nhật registerFormDetail thành công.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationById = async (req, res) => {
  try {
    const updated = await Registration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy đăng ký." });

    res.json({
      message: "Cập nhật thông tin đăng ký thành công.",
      data: updated,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const cancelExpiredRegistrations = async () => {
  const now = new Date();
  const expireThreshold = new Date(now.getTime() - 60 * 1000);

  try {
    const expiredRegs = await Registration.find({
      status: "unpaid",
      createdAt: { $lte: expireThreshold },
    })
      .populate("user")
      .populate({
        path: "room",
        populate: {
          path: "building",
          select: "name",
        },
      });

    for (const reg of expiredRegs) {
      await Registration.updateOne(
        { _id: reg._id },
        {
          $set: {
            status: "canceled",
            registerFormDetail:
              "Đơn đăng ký phòng của bạn đã bị hủy do quá hạn thanh toán. Nếu bạn vẫn có nhu cầu, vui lòng đăng ký lại.",
          },
        }
      );

      await sendMail(
        reg.email,
        "Đơn đăng ký bị hủy do quá hạn thanh toán",
        `Xin chào ${reg.fullname},\n\nĐơn đăng ký phòng "${reg.room.room} thuộc khu ${reg.room.building.name}" của bạn đã bị hủy vì quá hạn thanh toán. Nếu bạn vẫn có nhu cầu, vui lòng đăng ký lại.\n\nTrân trọng,\nBan quản lý ký túc xá`
      );

      console.log(`[Auto Cancel] Hủy đơn ${reg._id} quá hạn.`);
    }
  } catch (err) {
    console.error("❌ Lỗi khi quét đơn quá hạn:", err);
  }
};

export const deleteRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRegistration = await Registration.findByIdAndDelete(id);

    if (!deletedRegistration) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký để xóa" });
    }

    res
      .status(200)
      .json({ message: "Xóa đăng ký thành công", data: deletedRegistration });
  } catch (error) {
    console.error("Lỗi khi xóa đăng ký:", error);
    res.status(500).json({ message: "Lỗi server khi xóa đăng ký" });
  }
};

export const deleteUnapprovedRegistrations = async (req, res) => {
  try {
    const result = await Registration.deleteMany({
      status: { $ne: "approved" },
    });

    res.status(200).json({
      message: "Đã xóa thành công các đơn đăng ký không phải 'approved'",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Lỗi khi xóa đơn đăng ký:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const updatePaymentMethod = async (req, res) => {
  const { paymentMethod } = req.body;
  const { id } = req.params;

  const validMethods = ["Tiền mặt", "Chuyển khoản", "-"];
  if (!validMethods.includes(paymentMethod)) {
    return res
      .status(400)
      .json({ message: "Phương thức thanh toán không hợp lệ." });
  }

  try {
    const updated = await Registration.findByIdAndUpdate(
      id,
      { paymentMethod },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký." });
    }

    res.status(200).json({
      message: "Cập nhật phương thức thanh toán thành công.",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật paymentMethod:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

import RenewalRequestModel from "../models/RenewalRequest.js";
import Student from "../models/Student.js";
import { sendMail } from "../utils/registrationMailer.js";
import { sendRenewalInvoiceEmail } from "../middlewares/invoiceMailer.js";

// Generate ID logic
const generateRenewalRequestId = async () => {
  let code;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    code = `RR${randomNum}`;
    exists = await RenewalRequestModel.findOne({ renewalRequestId: code });
  }

  return code;
};

// Create new request
export const createRenewalRequest = async (req, res) => {
  try {
    const { student: studentId, notes } = req.body;

    const student = await Student.findById(studentId);
    if (!student || !student.endDate) {
      return res.status(400).json({ message: "Student or endDate not found" });
    }

    const endDate = new Date(student.endDate);
    let month = endDate.getMonth() + 2;
    let year = endDate.getFullYear();
    if (month === 13) {
      month = 1;
      year += 1;
    }

    // ✅ Kiểm tra đơn đã tồn tại chưa
    const existing = await RenewalRequestModel.findOne({
      student: studentId,
      month,
      year,
    });
    if (existing) {
      return res.status(400).json({
        message:
          "Bạn đã có một yêu cầu gia hạn cho thời gian này. Không thể gửi thêm.",
      });
    }

    const renewalRequestId = await generateRenewalRequestId();

    const newRequest = await RenewalRequestModel.create({
      student: studentId,
      notes,
      renewalRequestId,
      month,
      year,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating renewal request",
      error: error.message || error,
    });
  }
};

export const getMyRenewals = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm sinh viên đang ở
    const student = await Student.findOne({
      user: userId,
      status: "Đang ở",
    }).populate({
      path: "registration",
      populate: {
        path: "room",
        populate: {
          path: "building",
          select: "name",
        },
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sinh viên đang ở." });
    }

    const renewals = await RenewalRequestModel.find({
      student: student._id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        populate: {
          path: "registration",
          populate: {
            path: "room",
            populate: {
              path: "building",
              select: "name",
            },
          },
        },
      });

    res.status(200).json({ data: renewals, student });
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn gia hạn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Get all
export const getAllRenewalRequests = async (req, res) => {
  try {
    const requests = await RenewalRequestModel.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        populate: {
          path: "registration",
          populate: {
            path: "room",
            populate: {
              path: "building",
              select: "name",
            },
          },
        },
      });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching renewal requests", error });
  }
};

// Get by ID
export const getRenewalRequestById = async (req, res) => {
  try {
    const request = await RenewalRequestModel.findById(req.params.id).populate({
      path: "student",
      populate: {
        path: "registration",
        populate: {
          path: "room",
          populate: {
            path: "building",
            select: "name",
          },
        },
      },
    });

    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error fetching request", error });
  }
};

export const getRenewalRequestsByStatus = async (req, res) => {
  try {
    const { status, search, building, room, gender } = req.query;

    const validStatuses = [
      "unpaid",
      "pending",
      "approved",
      "rejected",
      "canceled",
      "refunded",
    ];
    const filter = {};

    // Lọc theo status
    if (status && status !== "all") {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ." });
      }
      filter.status = status;
    }

    // Populate student → registration → room → building
    let requests = await RenewalRequestModel.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        populate: {
          path: "registration",
          populate: {
            path: "room",
            populate: {
              path: "building",
            },
          },
        },
      });

    // Lọc theo search, gender, room, building
    requests = requests.filter((r) => {
      const student = r.student;
      const registration = student?.registration;
      const studentRoom = registration?.room;
      const studentBuilding = studentRoom?.building;

      const matchSearch =
        !search ||
        r.renewalRequestId?.toLowerCase().includes(search.toLowerCase()) ||
        registration?.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        registration?.studentId?.toLowerCase().includes(search.toLowerCase());

      const matchGender =
        !gender || gender === "all" || registration?.gender === gender;

      const matchRoom =
        !room || studentRoom?.room?.toLowerCase() === room.toLowerCase();

      const matchBuilding =
        !building ||
        studentBuilding?.name?.toLowerCase() === building.toLowerCase();

      return matchSearch && matchGender && matchRoom && matchBuilding;
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const updateRenewalRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      ![
        "pending",
        "approved",
        "rejected",
        "unpaid",
        "canceled",
        "refunded",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await RenewalRequestModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate({
      path: "student",
      populate: {
        path: "registration",
        select: "email fullname room",
        populate: {
          path: "room",
          populate: {
            path: "building",
            select: "name",
          },
        },
      },
    });

    if (!request) return res.status(404).json({ message: "Request not found" });

    // ✅ Nếu chuyển sang pending và là Tiền mặt → gửi hóa đơn
    if (status === "pending" && request.paymentMethod === "Tiền mặt") {
      await sendRenewalInvoiceEmail(request._id);
    }

    // ✅ Nếu đơn được duyệt thì cập nhật endDate của student
    if (status === "approved") {
      const { student, month, year } = request;
      if (!student || !student._id) {
        return res
          .status(400)
          .json({ message: "Student not found in request" });
      }

      const newEndDate = new Date(year, month, 0);
      await Student.findByIdAndUpdate(student._id, { endDate: newEndDate });
    }

    // ✅ Gửi mail nếu là approved, rejected hoặc refunded
    if (["approved", "rejected", "refunded"].includes(status)) {
      const registration = request.student?.registration;
      const email = registration?.email;
      const fullname = registration?.fullname;
      const code = request.renewalRequestId;
      const room = registration?.room?.room;
      const building = registration?.room?.building?.name;
      const note = request.notes || "Không có ghi chú.";

      if (email && fullname) {
        let subject = "";
        if (status === "approved") {
          subject = "Yêu cầu gia hạn phòng đã được duyệt";
        } else if (status === "rejected") {
          subject = "Yêu cầu gia hạn phòng đã bị từ chối";
        } else if (status === "refunded") {
          subject = "Bạn đã được hoàn tiền gia hạn phòng";
        }

        const text = `Chào ${fullname},\n\n${note}\n\nYêu cầu gia hạn: ${request.month}/${request.year}\nPhòng: ${room} - Khu: ${building}\nMã đăng ký: ${code}\n\nBan quản lý Ký túc xá - Đại học\nĐịa chỉ: Nhà A1 - Phòng 701\nAddress: A1 - Room 701\nĐiện thoại: 0987654321`;

        await sendMail(email, subject, text);
      }
    }

    res.json(request);
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    res.status(500).json({
      message: "Error updating status",
      error: error.message || error.toString() || "Unknown error",
    });
  }
};

// Update notes
export const updateRenewalRequestNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const request = await RenewalRequestModel.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error updating notes", error });
  }
};

// Update
export const updateRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { student, status, notes, month, year } = req.body;

    // Nếu status có trong body, kiểm tra hợp lệ
    if (
      status &&
      ![
        "pending",
        "approved",
        "rejected",
        "unpaid",
        "canceled",
        "refunded",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await RenewalRequestModel.findByIdAndUpdate(
      id,
      { student, status, notes, month, year },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Renewal request not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating renewal request", error });
  }
};

// Delete
export const deleteRenewalRequest = async (req, res) => {
  try {
    const deleted = await RenewalRequestModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting request", error });
  }
};

// Update payment method
export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params; // đây là ObjectId (gốc của MongoDB)
    const { paymentMethod } = req.body;

    const allowedMethods = ["Tiền mặt", "Chuyển khoản", "-"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán không hợp lệ." });
    }

    const updatedRequest = await RenewalRequestModel.findByIdAndUpdate(
      id,
      { paymentMethod },
      { new: true }
    );

    if (!updatedRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu gia hạn." });
    }

    res.status(200).json({
      message: "Cập nhật phương thức thanh toán thành công.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Lỗi cập nhật paymentMethod:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi cập nhật phương thức thanh toán." });
  }
};

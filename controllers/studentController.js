import StudentModel from "../models/Student.js";

// USER - Get student's own info + roommates (latest overlap logic)
export const getMyStudentInfo = async (req, res, next) => {
  try {
    // Lấy tất cả bản ghi của sinh viên hiện tại
    const students = await StudentModel.find({ user: req.user.id }).populate({
      path: "registration",
      populate: { path: "room", populate: { path: "building" } },
    });

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin sinh viên." });
    }

    const currentDate = new Date();
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Sắp xếp sinh viên mới nhất lên trước
    const sortedStudents = students.sort((a, b) => b.createdAt - a.createdAt);

    // Xử lý từng bản ghi student
    const data = await Promise.all(
      sortedStudents.map(async (student) => {
        const roomId = student.registration?.room?._id?.toString();
        if (!roomId) return null;

        // Lấy tất cả sinh viên khác để lọc roommate
        const allStudents = await StudentModel.find({
          _id: { $ne: student._id },
        })
          .populate({
            path: "registration",
            populate: { path: "room", populate: { path: "building" } },
          })
          .populate("user");

        // Lọc roommate cùng phòng
        const roommates = allStudents.filter((r) => {
          const rRoomId = r.registration?.room?._id?.toString();
          if (rRoomId !== roomId) return false;

          if (student.status === "Đang ở") {
            return (
              r.startDate <= currentMonthEnd &&
              r.endDate >= currentMonthStart &&
              r.status === "Đang ở"
            );
          } else {
            const bufferDays = 7;
            const lastWeek = new Date(student.endDate);
            lastWeek.setDate(lastWeek.getDate() - bufferDays);
            return r.startDate <= student.endDate && r.endDate >= lastWeek;
          }
        });

        return {
          _id: student._id,
          registration: student.registration?.toObject() || {},
          room: {
            room: student.registration.room?.room || "N/A",
            _id: student.registration.room?._id,
            building: {
              name: student.registration.room?.building?.name || "N/A",
              _id: student.registration.room?.building?._id,
            },
          },
          startDate: student.startDate,
          endDate: student.endDate,
          status: student.status,
          roommates: roommates.map((r) => ({
            name: r.registration?.fullname || "N/A",
            studentId: r.registration?.studentId || "N/A",
            school: r.registration?.school || "N/A",
            class: r.registration?.class || "N/A",
            course: r.registration?.course || "N/A",
            _id: r._id,
            startDate: r.startDate,
            endDate: r.endDate,
          })),
        };
      })
    );

    // Lọc bỏ null (nếu có student không có room hợp lệ)
    const filteredData = data.filter((item) => item !== null);

    res.status(200).json(filteredData);
  } catch (error) {
    next(error);
  }
};

//ADMIN - Get all students (FULL thông tin)
// export const getAllStudents = async (req, res, next) => {
//   try {
//     const students = await StudentModel.find()
//       .sort({ createdAt: -1 })
//       .populate("user")
//       .populate({
//         path: "room",
//         populate: { path: "building" },
//       })
//       .populate("registration");

//     res.status(200).json(students);
//   } catch (error) {
//     next(error);
//   }
// };

export const getAllStudents = async (req, res, next) => {
  try {
    // Lấy tất cả student, populate user và phòng + building
    const students = await StudentModel.find()
      .populate({
        path: "registration",
        populate: { path: "room", populate: { path: "building" } },
      })
      .populate("user")
      .sort({ createdAt: -1 }); // Sắp xếp giảm dần theo ngày tạo

    // Gom theo user._id
    const userMap = new Map();

    students.forEach((student) => {
      const userId = student.user._id.toString();

      const room = student.registration?.room;
      const building = room?.building;

      const historyItem = {
        buildingName: building?.name || "N/A",
        roomNumber: room?.room || "N/A",
        startDate: student.startDate,
        endDate: student.endDate,
        status: student.status,
      };

      // Nếu chưa có trong map thì khởi tạo
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          _id: student._id, // student mới nhất
          user: student.user,
          registration: student.registration,
          room: {
            room: room?.room || "N/A",
            _id: room?._id,
            building: {
              name: building?.name || "N/A",
              _id: building?._id,
            },
          },
          startDate: student.startDate,
          endDate: student.endDate,
          status: student.status,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
          __v: student.__v,
          history: [], // khởi tạo mảng lịch sử
        });
      }

      // Thêm vào lịch sử nếu đã trả
      if (student.status === "Đã trả") {
        userMap.get(userId).history.push(historyItem);
      }
    });

    const result = Array.from(userMap.values());

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// export const getAllStudents = async (req, res, next) => {
//   try {
//     // 1. Lấy tất cả student records, populate đầy đủ
//     const allStudents = await StudentModel.find()
//       .populate("user")
//       .populate("registration")
//       .populate({
//         path: "room",
//         populate: { path: "building" },
//       })
//       .sort({ createdAt: -1 }); // Để đảm bảo bản ghi mới nhất nằm trước

//     // 2. Gom các student theo user._id
//     const studentMap = new Map(); // key: userId, value: list of student records

//     allStudents.forEach((student) => {
//       const userId = student.user._id.toString();
//       if (!studentMap.has(userId)) {
//         studentMap.set(userId, []);
//       }
//       studentMap.get(userId).push(student);
//     });

//     // 3. Tạo kết quả
//     const result = [];

//     for (const [userId, studentList] of studentMap.entries()) {
//       const current = studentList[0]; // bản ghi mới nhất
//       const history = studentList.slice(1).map((s) => ({
//         buildingName: s.room?.building?.name || "N/A",
//         roomNumber: s.room?.room || "N/A",
//         startDate: s.startDate,
//         endDate: s.endDate,
//         status: s.status,
//       }));

//       result.push({
//         _id: current._id,
//         user: current.user,
//         registration: current.registration,
//         room: current.room,
//         startDate: current.startDate,
//         endDate: current.endDate,
//         status: current.status,
//         createdAt: current.createdAt,
//         updatedAt: current.updatedAt,
//         history,
//       });
//     }

//     res.status(200).json(result);
//   } catch (error) {
//     next(error);
//   }
// };

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Lấy student, populate user, registration, rồi từ registration populate room và building
    const student = await StudentModel.findById(id)
      .populate("user")
      .populate({
        path: "registration",
        populate: {
          path: "room",
          populate: { path: "building" },
        },
      });

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    }

    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Update status của sinh viên
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const student = await StudentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    }

    student.status = status;
    await student.save();

    res.status(200).json({ message: "Cập nhật trạng thái thành công." });
  } catch (error) {
    next(error);
  }
};

export const autoUpdateStudentStatuses = async () => {
  const now = new Date();

  try {
    const result = await StudentModel.updateMany(
      { endDate: { $lt: now }, status: { $ne: "Đã trả" } },
      { $set: { status: "Đã trả" } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[Auto Update] Đã cập nhật ${result.modifiedCount} sinh viên thành "Đã trả".`
      );
    }
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật trạng thái sinh viên:", err);
  }
};

// Lấy lịch sử phòng ở
export const getAllStudentRoomHistory = async (req, res, next) => {
  try {
    const students = await StudentModel.find()
      .populate({
        path: "room",
        populate: { path: "building" },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    // Gom nhóm theo user._id
    const studentHistories = {};

    students.forEach((student) => {
      const userId = student.user._id.toString();

      const historyItem = {
        buildingName: student.room?.building?.name || "N/A",
        roomNumber: student.room?.room || "N/A",
        startDate: student.startDate,
        endDate: student.endDate,
        status: student.status,
      };

      if (!studentHistories[userId]) {
        studentHistories[userId] = {
          studentId: student._id,
          fullname: student.user.fullname || "Chưa có tên",
          history: [],
        };
      }

      studentHistories[userId].history.push(historyItem);
    });

    const result = Object.values(studentHistories);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Lấy lịch sử ở ký túc xá của sinh viên
export const getStudentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.findById(id).populate({
      path: "room",
      populate: { path: "building" },
    });

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    }

    const history = {
      buildingName: student.room?.building?.name || "",
      roomNumber: student.room?.room || "",
      startDate: student.startDate || "",
      endDate: student.endDate || "",
      status: student.status,
    };

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// Update - Cập nhật thông tin sinh viên
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra sự tồn tại của student
    const student = await StudentModel.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    }

    // Cập nhật các trường
    if (updateData.user) student.user = updateData.user;
    if (updateData.registration) student.registration = updateData.registration;
    if (updateData.room) student.room = updateData.room;
    if (updateData.startDate)
      student.startDate = new Date(updateData.startDate);
    if (updateData.endDate) student.endDate = new Date(updateData.endDate);
    if (updateData.status) student.status = updateData.status;

    await student.save();

    res.status(200).json({ message: "Cập nhật sinh viên thành công", student });
  } catch (error) {
    console.error("Lỗi khi cập nhật sinh viên:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật sinh viên." });
  }
};

// DELETE - Delete student by ID
export const deleteStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.findByIdAndDelete(id);

    if (!student) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sinh viên để xóa." });
    }

    res.status(200).json({ message: "Xóa sinh viên thành công.", student });
  } catch (error) {
    next(error);
  }
};

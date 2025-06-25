// controllers/BuildingController.js
import Building from "../models/Building.js";
import Student from "../models/Student.js";
import { errorHandler } from "../utils/errorHandler.js";

// Admin
export const createBuilding = async (req, res, next) => {
  try {
    const existing = await Building.findOne({ name: req.body.name });
    if (existing) {
      return res.status(400).json({ message: "Tên khu nhà đã tồn tại." });
    }

    const building = new Building(req.body);
    await building.save();
    res.status(201).json(building);
  } catch (error) {
    next(error);
  }
};

export const getBuildings = async (req, res, next) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });

    const studentCounts = await Student.aggregate([
      {
        $match: { status: "Đang ở" },
      },
      {
        $lookup: {
          from: "registrations",
          localField: "registration",
          foreignField: "_id",
          as: "reg",
        },
      },
      { $unwind: "$reg" },
      {
        $lookup: {
          from: "rooms",
          localField: "reg.room",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $group: {
          _id: "$room.building",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    studentCounts.forEach((item) => {
      countMap[item._id?.toString()] = item.count;
    });

    const buildingsWithCount = buildings
      .map((building) => ({
        ...building.toObject(),
        rentedStudents: countMap[building._id.toString()] || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(buildingsWithCount);
  } catch (error) {
    next(error);
  }
};

export const getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) return next(errorHandler(404, "Building not found"));

    const studentCounts = await Student.aggregate([
      {
        $match: { status: "Đang ở" },
      },
      {
        $lookup: {
          from: "registrations",
          localField: "registration",
          foreignField: "_id",
          as: "reg",
        },
      },
      { $unwind: "$reg" },
      {
        $lookup: {
          from: "rooms",
          localField: "reg.room",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $group: {
          _id: "$room.building",
          count: { $sum: 1 },
        },
      },
    ]);

    const rentedStudents = studentCount[0]?.rentedStudents || 0;

    res.status(200).json({
      ...building.toObject(),
      rentedStudents,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBuilding = async (req, res, next) => {
  try {
    const buildingId = req.params.id;
    const { name } = req.body;

    // Kiểm tra tên mới có trùng với building khác không
    const existing = await Building.findOne({
      _id: { $ne: buildingId }, // loại trừ chính building đang cập nhật
      name: name,
    });

    if (existing) {
      return res.status(400).json({ message: "Tên khu nhà đã tồn tại." });
    }

    const updated = await Building.findByIdAndUpdate(buildingId, req.body, {
      new: true,
    });

    if (!updated) return next(errorHandler(404, "Building not found"));

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteBuilding = async (req, res, next) => {
  try {
    await Building.findByIdAndDelete(req.params.id);
    res.status(200).json("Building deleted");
  } catch (error) {
    next(error);
  }
};

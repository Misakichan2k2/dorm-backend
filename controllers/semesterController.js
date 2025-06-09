import Semester from "../models/Semester.js";

// Create
export const createSemester = async (req, res, next) => {
  try {
    const newSemester = new Semester(req.body);
    const saved = await newSemester.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// Get all
export const getAllSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.find().sort({ createdAt: -1 });
    res.status(200).json(semesters);
  } catch (error) {
    next(error);
  }
};

// Get by ID
export const getSemesterById = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester)
      return res.status(404).json({ message: "Không tìm thấy học kỳ." });
    res.status(200).json(semester);
  } catch (error) {
    next(error);
  }
};

// Update
export const updateSemester = async (req, res, next) => {
  try {
    const updated = await Semester.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy học kỳ." });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete
export const deleteSemester = async (req, res, next) => {
  try {
    const deleted = await Semester.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy học kỳ." });
    res.status(200).json({ message: "Xóa học kỳ thành công." });
  } catch (error) {
    next(error);
  }
};

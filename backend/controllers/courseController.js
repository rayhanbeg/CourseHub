import Course from '../models/Course.js';
import Module from '../models/Module.js';
import { validationSchemas, validate } from '../utils/validation.js';

// Get All Courses
export const getAllCourses = async (req, res, next) => {
  try {
    const { category, level, page = 1, limit = 10 } = req.query;

    let filter = { isPublished: true };

    if (category) filter.category = category;
    if (level) filter.level = level;

    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate('instructor', 'name profileImage')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Course
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name profileImage bio')
      .populate({
        path: 'modules',
        populate: {
          path: 'lessons',
        },
      });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Create Course (Admin only)
export const createCourse = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.createCourse, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const course = new Course({
      ...value,
      thumbnail: value.thumbnail?.trim() || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
      instructor: req.user._id,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Update Course (Admin only)
export const updateCourse = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.updateCourse, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const course = await Course.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Course (Admin only)
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Delete all modules and lessons associated with the course
    await Module.deleteMany({ course: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get Instructor Courses
export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).populate('modules');

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// Search Courses
export const searchCourses = async (req, res, next) => {
  try {
    const { query, category, level } = req.query;

    let filter = { isPublished: true };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (level) filter.level = level;

    const courses = await Course.find(filter)
      .populate('instructor', 'name profileImage')
      .limit(20);

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

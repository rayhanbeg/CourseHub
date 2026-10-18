import Course from '../models/Course.js';
import Module from '../models/Module.js';
import { validationSchemas, validate } from '../utils/validation.js';
import { uploadImageBuffer, uploadVideoBuffer } from '../utils/cloudinary.js';

// Get All Courses
export const getAllCourses = async (req, res, next) => {
  try {
    const { category, level, page = 1, limit = 12, sort = 'newest' } = req.query;

    let filter = { isPublished: true };

    if (category) filter.category = category;
    if (level) filter.level = level;

    const skip = (page - 1) * limit;

    const sortBy = sort === 'popular' ? { enrollmentCount: -1, createdAt: -1 } : sort === 'price' ? { price: 1, createdAt: -1 } : { createdAt: -1 };
    const courses = await Course.find(filter)
      .populate('instructor', 'name profileImage')
      .populate({ path: 'modules', select: 'lessons', populate: { path: 'lessons', select: 'videoDuration' } })
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortBy);

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
        options: { sort: { sequenceNumber: 1 } },
        populate: {
          path: 'lessons',
          options: { sort: { sequenceNumber: 1 } },
        },
      });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const hasCourseAccess = req.user?.role === 'admin' || req.user?._id?.toString() === course.instructor?._id?.toString() || req.user?.enrolledCourses?.some(
      (enrollment) => enrollment.courseId?.toString() === course._id.toString()
    );
    course.modules.forEach((module) => module?.lessons?.forEach((lesson) => {
      if (!lesson) return;
      const hasVideo = Boolean(lesson.videoPublicId || lesson.videoUrl);
      const allowed = hasCourseAccess || (course.isPublished && lesson.isPreview);
      lesson.videoUrl = '';
      lesson.videoPublicId = undefined;
      lesson.set('hasVideo', hasVideo, { strict: false });
      lesson.set('locked', !allowed, { strict: false });
    }));

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
      description: value.fullDescription || value.description,
      fullDescription: value.fullDescription || value.description,
      thumbnail: value.thumbnail?.trim() || '',
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

    const update = { ...value };
    if (value.fullDescription !== undefined) update.description = value.fullDescription;
    else if (value.description !== undefined) {
      const legacyParts = value.description.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
      if (value.shortDescription === undefined && legacyParts.length > 1) {
        update.shortDescription = legacyParts[0];
        update.fullDescription = legacyParts.slice(1).join('\n\n');
        update.description = update.fullDescription;
      } else {
        update.fullDescription = value.description;
      }
    }
    if (value.isPublished === true) {
      const current = await Course.findById(req.params.id).select('thumbnail price');
      if (!current) return res.status(404).json({ message: 'Course not found' });
      const thumbnail = value.thumbnail !== undefined ? value.thumbnail : current.thumbnail;
      const price = value.price !== undefined ? value.price : current.price;
      const modules = await Module.find({ course: req.params.id }).select('_id lessons');
      const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
      const issues = [];
      if (!thumbnail?.trim()) issues.push('Add a course thumbnail');
      if (modules.length < 1) issues.push('Add at least one section');
      if (lessonCount < 1) issues.push('Add at least one lesson');
      if (modules.some((module) => module.lessons.length === 0)) issues.push('Every section needs at least one lesson');
      if (price === undefined || price === null || Number(price) < 0) issues.push('Set a valid course price');
      if (issues.length) return res.status(400).json({ message: 'Complete the publish checklist first.', issues });
    }
    const course = await Course.findByIdAndUpdate(req.params.id, update, {
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
    const { query, category, level, page = 1, limit = 20 } = req.query;

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
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .sort({ createdAt: -1 });
    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      courses,
    });
  } catch (error) {
    next(error);
  }
};


// Upload Course Thumbnail (Admin only)
export const uploadCourseThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Thumbnail image is required' });
    }

    const thumbnail = await uploadImageBuffer(req.file.buffer);

    res.status(200).json({
      success: true,
      thumbnail,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Course Intro Video (Admin only)
export const uploadCourseIntroVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const video = await uploadVideoBuffer(req.file.buffer, 'course-intro-videos');

    res.status(200).json({
      success: true,
      video,
    });
  } catch (error) {
    next(error);
  }
};

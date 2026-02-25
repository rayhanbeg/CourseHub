import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { validationSchemas, validate } from '../utils/validation.js';

// Create Module
export const createModule = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.createModule, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Verify course exists and user is instructor
    const course = await Course.findById(value.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add modules to this course' });
    }

    const module = new Module({
      title: value.title,
      description: value.description,
      course: value.courseId,
      sequenceNumber: value.sequenceNumber,
    });

    await module.save();

    // Add module to course
    course.modules.push(module._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      module,
    });
  } catch (error) {
    next(error);
  }
};

// Get Module
export const getModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id).populate({
      path: 'lessons',
      model: 'Lesson',
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.status(200).json({
      success: true,
      module,
    });
  } catch (error) {
    next(error);
  }
};

// Update Module
export const updateModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check authorization
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this module' });
    }

    const { title, description, sequenceNumber } = req.body;

    module.title = title || module.title;
    module.description = description || module.description;
    module.sequenceNumber = sequenceNumber || module.sequenceNumber;

    await module.save();

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      module,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Module
export const deleteModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check authorization
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this module' });
    }

    // Delete all lessons in the module
    await Lesson.deleteMany({ module: req.params.id });

    // Remove module from course
    await Course.findByIdAndUpdate(module.course._id, {
      $pull: { modules: req.params.id },
    });

    await Module.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get Course Modules
export const getCourseModules = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const modules = await Module.find({ course: courseId })
      .populate('lessons')
      .sort({ sequenceNumber: 1 });

    res.status(200).json({
      success: true,
      modules,
    });
  } catch (error) {
    next(error);
  }
};

// Reorder Modules
export const reorderModules = async (req, res, next) => {
  try {
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({ message: 'Invalid module order' });
    }

    for (let i = 0; i < modules.length; i++) {
      await Module.findByIdAndUpdate(modules[i], { sequenceNumber: i + 1 });
    }

    res.status(200).json({
      success: true,
      message: 'Modules reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

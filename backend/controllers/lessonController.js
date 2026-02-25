import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import { validationSchemas, validate } from '../utils/validation.js';
import { uploadVideoBuffer } from '../utils/cloudinary.js';

// Create Lesson
export const createLesson = async (req, res, next) => {
  try {
    const { isValid, errors, value } = validate(validationSchemas.createLesson, req.body);

    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const module = await Module.findById(value.moduleId).populate('course');
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add lessons to this module' });
    }

    const lesson = new Lesson({
      title: value.title,
      description: value.description,
      videoUrl: value.videoUrl || '',
      videoDuration: value.videoDuration,
      isPreview: value.isPreview || false,
      resources: value.resources || [],
      module: value.moduleId,
      sequenceNumber: value.sequenceNumber,
    });

    await lesson.save();

    module.lessons.push(lesson._id);
    await module.save();

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('module');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.status(200).json({ success: true, lesson });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (lesson.module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }

    const { title, description, videoUrl, videoDuration, resources, sequenceNumber, isPreview } = req.body;

    lesson.title = title || lesson.title;
    lesson.description = description ?? lesson.description;
    lesson.videoUrl = videoUrl || lesson.videoUrl;
    lesson.videoDuration = videoDuration !== undefined ? videoDuration : lesson.videoDuration;
    lesson.resources = resources || lesson.resources;
    lesson.sequenceNumber = sequenceNumber !== undefined ? sequenceNumber : lesson.sequenceNumber;
    lesson.isPreview = isPreview !== undefined ? isPreview : lesson.isPreview;

    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (lesson.module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }

    await Module.findByIdAndUpdate(lesson.module._id, { $pull: { lessons: req.params.id } });
    await Lesson.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getModuleLessons = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const lessons = await Lesson.find({ module: moduleId }).sort({ sequenceNumber: 1 });
    res.status(200).json({ success: true, lessons });
  } catch (error) {
    next(error);
  }
};

export const addResources = async (req, res, next) => {
  try {
    const { resources } = req.body;

    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (lesson.module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this lesson' });
    }

    if (Array.isArray(resources)) lesson.resources = [...lesson.resources, ...resources];
    else lesson.resources.push(resources);

    await lesson.save();

    res.status(200).json({ success: true, message: 'Resources added successfully', lesson });
  } catch (error) {
    next(error);
  }
};

export const removeResource = async (req, res, next) => {
  try {
    const { resourceIndex } = req.body;

    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (lesson.module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this lesson' });
    }

    if (resourceIndex >= 0 && resourceIndex < lesson.resources.length) {
      lesson.resources.splice(resourceIndex, 1);
      await lesson.save();
    }

    res.status(200).json({ success: true, message: 'Resource removed successfully', lesson });
  } catch (error) {
    next(error);
  }
};

export const reorderLessons = async (req, res, next) => {
  try {
    const { lessons } = req.body;

    if (!Array.isArray(lessons)) {
      return res.status(400).json({ message: 'Invalid lesson order' });
    }

    for (let i = 0; i < lessons.length; i++) {
      await Lesson.findByIdAndUpdate(lessons[i], { sequenceNumber: i + 1 });
    }

    res.status(200).json({ success: true, message: 'Lessons reordered successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadLessonVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lesson video file is required' });
    }

    const video = await uploadVideoBuffer(req.file.buffer, 'lesson-videos');

    res.status(200).json({ success: true, video });
  } catch (error) {
    next(error);
  }
};
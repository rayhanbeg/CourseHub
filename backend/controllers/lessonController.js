import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import { validationSchemas, validate } from '../utils/validation.js';
import { makeTemporaryVideoUrl, uploadVideoBuffer, uploadResourceBuffer } from '../utils/cloudinary.js';

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
      videoUrl: '',
      videoPublicId: value.videoPublicId || '',
      videoFormat: value.videoFormat || 'mp4',
      videoDeliveryType: value.videoPublicId ? 'authenticated' : 'upload',
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
    const lesson = await Lesson.findById(req.params.id).populate({ path: 'module', populate: { path: 'course', select: 'title isPublished instructor' } });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const hasAccess = (lesson.isPreview && lesson.module.course.isPublished) || req.user?.role === 'admin' || req.user?._id?.toString() === lesson.module.course.instructor?.toString() || req.user?.enrolledCourses?.some((item) => item.courseId.toString() === lesson.module.course._id.toString());
    const hasVideo = Boolean(lesson.videoPublicId || lesson.videoUrl);
    lesson.videoUrl = '';
    lesson.videoPublicId = undefined;
    lesson.set('hasVideo', hasVideo, { strict: false });
    lesson.set('locked', !hasAccess, { strict: false });

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

    const { title, description, videoDuration, resources, sequenceNumber, isPreview, videoPublicId, videoFormat } = req.body;

    if (title !== undefined && !title.trim()) return res.status(400).json({ message: 'Lesson title is required' });
    lesson.title = title ?? lesson.title;
    lesson.description = description ?? lesson.description;
    if (videoPublicId !== undefined) {
      lesson.videoPublicId = videoPublicId;
      lesson.videoDeliveryType = videoPublicId ? 'authenticated' : 'upload';
      lesson.videoUrl = '';
    }
    if (videoFormat !== undefined) lesson.videoFormat = videoFormat || 'mp4';
    lesson.videoDuration = videoDuration !== undefined ? videoDuration : lesson.videoDuration;
    lesson.resources = resources ?? lesson.resources;
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
    const module = await Module.findById(moduleId).populate('course', 'isPublished instructor');
    if (!module) return res.status(404).json({ message: 'Module not found' });
    const lessons = await Lesson.find({ module: moduleId }).sort({ sequenceNumber: 1 });
    lessons.forEach((lesson) => {
      const allowed = (lesson.isPreview && module.course.isPublished) || req.user?.role === 'admin' || req.user?.enrolledCourses?.some((item) => item.courseId.toString() === module.course._id.toString());
      const hasVideo = Boolean(lesson.videoPublicId || lesson.videoUrl);
      lesson.videoUrl = '';
      lesson.videoPublicId = undefined;
      lesson.set('hasVideo', hasVideo, { strict: false });
      lesson.set('locked', !allowed, { strict: false });
    });
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
    const { moduleId, lessonIds } = req.body;
    if (!moduleId || !Array.isArray(lessonIds) || new Set(lessonIds).size !== lessonIds.length) {
      return res.status(400).json({ message: 'Invalid lesson order' });
    }
    const module = await Module.findById(moduleId).populate('course', 'instructor');
    if (!module) return res.status(404).json({ message: 'Section not found' });
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to reorder lessons' });
    const actualIds = (await Lesson.find({ module: moduleId }).distinct('_id')).map((id) => id.toString());
    if (actualIds.length !== lessonIds.length || actualIds.some((id) => !lessonIds.includes(id))) return res.status(400).json({ message: 'Lesson order must include every lesson in this section exactly once' });
    await Lesson.bulkWrite(lessonIds.map((id, index) => ({ updateOne: { filter: { _id: id, module: moduleId }, update: { $set: { sequenceNumber: index + 1 } } } })));

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

    const video = await uploadVideoBuffer(req.file.buffer, 'lesson-videos', { authenticated: true });

    res.status(200).json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

export const getLessonStream = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({ path: 'module', populate: { path: 'course', select: 'title isPublished instructor' } });
    if (!lesson?.module?.course) return res.status(404).json({ message: 'Lesson not found' });
    const course = lesson.module.course;
    const preview = lesson.isPreview && course.isPublished;
    if (!req.user && !preview) return res.status(401).json({ message: 'Authentication required' });
    const enrolled = req.user?.role === 'admin' || req.user?.enrolledCourses?.some((item) => item.courseId.toString() === course._id.toString());
    const owner = req.user?._id?.toString() === course.instructor?.toString();
    if (!preview && !enrolled && !owner) return res.status(403).json({ message: 'Enrollment required to watch this lesson' });
    if (!lesson.videoPublicId && !lesson.videoUrl) return res.status(404).json({ message: 'Video is unavailable' });
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    let url;
    if (lesson.videoPublicId) {
      url = makeTemporaryVideoUrl(lesson.videoPublicId, lesson.videoFormat || 'mp4', expiresAt);
    } else {
      const parsed = new URL(lesson.videoUrl);
      const marker = '/video/upload/';
      const path = parsed.pathname.split(marker)[1];
      if (!path || !parsed.hostname.endsWith('cloudinary.com')) return res.status(409).json({ message: 'This legacy video must be migrated before it can be streamed securely' });
      const parts = path.split('/');
      if (/^v\d+$/.test(parts[0])) parts.shift();
      const filename = parts.pop() || '';
      const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1) : lesson.videoFormat || 'mp4';
      const publicId = [...parts, filename.replace(/\.[^.]+$/, '')].join('/');
      url = makeTemporaryVideoUrl(publicId, extension, expiresAt, 'upload');
    }
    res.set({
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin',
    });
    res.status(200).json({ success: true, url, expiresAt });
  } catch (error) { next(error); }
};

export const uploadLessonResource = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF resource to upload' });
    const resource = await uploadResourceBuffer(req.file.buffer, req.file.originalname);
    res.status(200).json({ success: true, resource });
  } catch (error) { next(error); }
};

import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { randomUUID } from 'node:crypto';

const buildCourseLessonOrder = async (courseId) => {
  const modules = await Module.find({ course: courseId })
    .select('lessons sequenceNumber')
    .sort({ sequenceNumber: 1 })
    .populate('lessons', '_id sequenceNumber');

  const lessonIds = [];

  modules.forEach((module) => {
    const sortedLessons = [...(module.lessons || [])].sort(
      (a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
    );

    sortedLessons.forEach((lesson) => {
      if (lesson?._id) {
        lessonIds.push(lesson._id.toString());
      }
    });
  });

  return lessonIds;
};

const recalculateProgressSummary = (progress) => {
  const totalLessons = progress.lessons.length;
  const completedLessons = progress.lessons.filter((lesson) => lesson.isCompleted).length;

  progress.overallProgress = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  progress.totalLessons = totalLessons;
  progress.completedLessons = completedLessons;

  if (progress.overallProgress === 100 && totalLessons > 0) {
    progress.isCompleted = true;
    progress.completedAt = progress.completedAt || new Date();
    progress.certificateId = progress.certificateId || `COURSEHUB-${randomUUID().toUpperCase()}`;
  } else {
    progress.isCompleted = false;
    progress.completedAt = null;
  }
};

const hasCourseAccess = (user, courseId) => user.role === 'admin' || user.enrolledCourses?.some((entry) => entry.courseId?.toString() === courseId.toString());

const mergeProgressDocs = (primary, secondaryDocs) => {
  const lessonMap = new Map(
    primary.lessons.map((lessonProgress) => [lessonProgress.lesson.toString(), lessonProgress])
  );

  secondaryDocs.forEach((doc) => {
    (doc.lessons || []).forEach((lessonProgress) => {
      const lessonId = lessonProgress.lesson.toString();
      const existing = lessonMap.get(lessonId);

      if (!existing) {
        lessonMap.set(lessonId, {
          lesson: lessonProgress.lesson,
          isCompleted: lessonProgress.isCompleted,
          watchTime: lessonProgress.watchTime,
          completedAt: lessonProgress.completedAt,
        });
        return;
      }

      existing.isCompleted = existing.isCompleted || lessonProgress.isCompleted;
      existing.watchTime = Math.max(existing.watchTime || 0, lessonProgress.watchTime || 0);
      existing.completedAt = existing.completedAt || lessonProgress.completedAt || null;
    });
  });

  primary.lessons = Array.from(lessonMap.values());
};

const getCanonicalProgress = async (studentId, courseId) => {
  const progressDocs = await Progress.find({ student: studentId, course: courseId }).sort({ updatedAt: -1 });
  if (progressDocs.length === 0) return null;

  const [primary, ...duplicates] = progressDocs;

  if (duplicates.length > 0) {
    mergeProgressDocs(primary, duplicates);
    recalculateProgressSummary(primary);
    await primary.save();

    await Progress.deleteMany({ _id: { $in: duplicates.map((doc) => doc._id) } });
  }

  return primary;
};

const syncProgressWithCourseLessons = async (progress, courseId) => {
  const courseLessonIds = await buildCourseLessonOrder(courseId);
  const currentMap = new Map(
    progress.lessons.map((lessonProgress) => [
      lessonProgress.lesson.toString(),
      lessonProgress,
    ])
  );

  const syncedLessons = courseLessonIds.map((lessonId) => {
    const existing = currentMap.get(lessonId);

    if (existing) {
      return {
        lesson: existing.lesson,
        isCompleted: existing.isCompleted,
        watchTime: existing.watchTime,
        completedAt: existing.completedAt,
      };
    }

    return {
      lesson: lessonId,
      isCompleted: false,
      watchTime: 0,
      completedAt: null,
    };
  });

  const hasChanged =
    syncedLessons.length !== progress.lessons.length ||
    syncedLessons.some((lesson, index) => {
      const current = progress.lessons[index];
      if (!current) return true;

      return (
        current.lesson.toString() !== lesson.lesson.toString() ||
        current.isCompleted !== lesson.isCompleted ||
        current.watchTime !== lesson.watchTime ||
        (current.completedAt?.toISOString?.() || null) !== (lesson.completedAt?.toISOString?.() || null)
      );
    });

  if (hasChanged) {
    progress.lessons = syncedLessons;
  }

  recalculateProgressSummary(progress);
  if (hasChanged || progress.isModified('totalLessons') || progress.isModified('completedLessons') || progress.isModified('overallProgress') || progress.isModified('isCompleted') || progress.isModified('completedAt') || progress.isModified('certificateId')) await progress.save();

  return progress;
};

// Get User Course Progress
export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!hasCourseAccess(req.user, courseId)) return res.status(403).json({ message: 'Course enrollment is required to view progress' });

    let progress = await getCanonicalProgress(req.user._id, courseId);

    if (!progress) {
      const courseLessonIds = await buildCourseLessonOrder(courseId);
      progress = await Progress.create({
        student: req.user._id,
        course: courseId,
        lessons: courseLessonIds.map((lesson) => ({ lesson, isCompleted: false, watchTime: 0 })),
      });
    }

    progress = await syncProgressWithCourseLessons(progress, courseId);

    const populatedProgress = await Progress.findById(progress._id).populate({
      path: 'lessons.lesson',
      select: 'title videoDuration module',
    }).populate('lastLesson', 'title videoDuration');

    res.status(200).json({
      success: true,
      progress: populatedProgress,
    });
  } catch (error) {
    next(error);
  }
};

// Update Lesson Progress
export const updateLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { isCompleted, watchTime } = req.body;
    if (!hasCourseAccess(req.user, courseId)) return res.status(403).json({ message: 'Course enrollment is required to update progress' });

    let progress = await getCanonicalProgress(req.user._id, courseId);

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    progress = await syncProgressWithCourseLessons(progress, courseId);

    const lessonIndex = progress.lessons.findIndex(
      (lessonProgress) => lessonProgress.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Lesson not found in this course progress' });
    }

    const lesson = await Lesson.findById(lessonId).select('videoDuration module');
    const module = lesson ? await Module.findOne({ _id: lesson.module, course: courseId }).select('_id') : null;
    if (!lesson || !module) return res.status(404).json({ message: 'Lesson not found in this course' });

    const watched = Number(watchTime);
    const autoComplete = Number.isFinite(watched) && lesson.videoDuration > 0 && watched / lesson.videoDuration >= 0.9;
    const markCompleted = isCompleted === true || autoComplete;
    if (markCompleted) {
      progress.lessons[lessonIndex].isCompleted = true;
      progress.lessons[lessonIndex].completedAt = progress.lessons[lessonIndex].completedAt || new Date();
    }

    if (watchTime !== undefined) {
      progress.lessons[lessonIndex].watchTime = Number.isFinite(watched) ? Math.max(0, Math.min(watched, lesson.videoDuration || watched)) : progress.lessons[lessonIndex].watchTime;
      progress.lastLesson = lesson._id;
      progress.lastPosition = progress.lessons[lessonIndex].watchTime;
    }

    recalculateProgressSummary(progress);

    await progress.save();

    const populatedProgress = await Progress.findById(progress._id).populate({
      path: 'lessons.lesson',
      select: 'title videoDuration module',
    }).populate('lastLesson', 'title videoDuration');

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      progress: populatedProgress,
    });
  } catch (error) {
    next(error);
  }
};

// Get All User Progress
export const getAllUserProgress = async (req, res, next) => {
  try {
    const progressList = await Progress.find({ student: req.user._id }).select('course');

    const uniqueCourseIds = [...new Set(progressList.map((progress) => progress.course.toString()))];

    for (const courseId of uniqueCourseIds) {
      const canonical = await getCanonicalProgress(req.user._id, courseId);
      if (canonical) {
        await syncProgressWithCourseLessons(canonical, courseId);
      }
    }

    const refreshedProgressList = await Progress.find({
      student: req.user._id,
    })
      .populate('course', 'title thumbnail')
      .populate('lastLesson', 'title videoDuration')
      .populate('lessons.lesson', 'title videoDuration')
      .sort({ updatedAt: -1 });

    const seenCourseIds = new Set();
    const uniqueProgress = refreshedProgressList.filter((progress) => {
      const courseId = progress.course?._id?.toString();
      if (!courseId || seenCourseIds.has(courseId)) {
        return false;
      }
      seenCourseIds.add(courseId);
      return true;
    });

    res.status(200).json({
      success: true,
      progress: uniqueProgress,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!hasCourseAccess(req.user, courseId)) return res.status(403).json({ message: 'Course enrollment is required' });
    let progress = await getCanonicalProgress(req.user._id, courseId);
    if (progress) progress = await syncProgressWithCourseLessons(progress, courseId);
    if (!progress?.isCompleted) return res.status(409).json({ message: 'Complete the course to receive your certificate' });
    if (!progress.certificateId) { recalculateProgressSummary(progress); await progress.save(); }
    const [student, course] = await Promise.all([User.findById(req.user._id).select('name'), Course.findById(courseId).select('title')]);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const safe = (value) => String(value || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1');
    const lines = [
      'BT /F1 30 Tf 85 475 Td (Certificate of Completion) Tj',
      `/F1 16 Tf 0 -70 Td (${safe(student?.name)}) Tj`,
      '/F1 12 Tf 0 -35 Td (has successfully completed) Tj',
      `/F1 20 Tf 0 -40 Td (${safe(course.title)}) Tj`,
      `/F1 12 Tf 0 -55 Td (Completed ${new Date(progress.completedAt || progress.updatedAt).toLocaleDateString('en-US')}) Tj`,
      `/F1 10 Tf 0 -30 Td (Certificate ID: ${safe(progress.certificateId)}) Tj`,
      'ET',
    ].join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(`${lines}\n`, 'ascii')} >>\nstream\n${lines}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'ascii')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xrefOffset = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${courseId}.pdf"`);
    res.send(Buffer.from(pdf, 'ascii'));
  } catch (error) { next(error); }
};

// Get Course Students Progress (Admin)
export const getCourseStudentsProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const progressList = await Progress.find({ course: courseId })
      .populate('student', 'name email profileImage')
      .sort({ overallProgress: -1 });

    res.status(200).json({
      success: true,
      progress: progressList,
    });
  } catch (error) {
    next(error);
  }
};

// Get Course Analytics (Admin)
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const progressList = await Progress.find({ course: courseId });

    const totalStudents = progressList.length;
    const completedStudents = progressList.filter((p) => p.isCompleted).length;
    const averageProgress = progressList.length > 0
      ? Math.round(
          progressList.reduce((sum, p) => sum + p.overallProgress, 0) / progressList.length
        )
      : 0;

    const avgWatchTime = progressList.length > 0
      ? Math.round(
          progressList.reduce((sum, p) => {
            const total = p.lessons.reduce((lessonSum, l) => lessonSum + l.watchTime, 0);
            return sum + total;
          }, 0) / progressList.length
        )
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalStudents,
        completedStudents,
        completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
        averageProgress,
        avgWatchTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

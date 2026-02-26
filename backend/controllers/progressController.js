import Progress from '../models/Progress.js';
import Module from '../models/Module.js';

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
      lessonIds.push(lesson._id.toString());
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

  if (progress.overallProgress === 100 && totalLessons > 0) {
    if (!progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
  } else {
    progress.isCompleted = false;
    progress.completedAt = null;
  }
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
    recalculateProgressSummary(progress);
    await progress.save();
  }

  return progress;
};

// Get User Course Progress
export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    let progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    progress = await syncProgressWithCourseLessons(progress, courseId);

    const populatedProgress = await Progress.findById(progress._id).populate({
      path: 'lessons.lesson',
      select: 'title videoDuration',
    });

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

    let progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    });

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

    if (isCompleted !== undefined) {
      progress.lessons[lessonIndex].isCompleted = isCompleted;
      if (isCompleted) {
        progress.lessons[lessonIndex].completedAt = new Date();
      } else {
        progress.lessons[lessonIndex].completedAt = null;
      }
    }

    if (watchTime !== undefined) {
      progress.lessons[lessonIndex].watchTime = watchTime;
    }

    recalculateProgressSummary(progress);

    await progress.save();

    const populatedProgress = await Progress.findById(progress._id).populate({
      path: 'lessons.lesson',
      select: 'title videoDuration',
    });

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
    const progressList = await Progress.find({
      student: req.user._id,
    })
      .populate('course', 'title thumbnail')
      .sort({ updatedAt: -1 });

    const seenCourseIds = new Set();
    const uniqueProgress = progressList.filter((progress) => {
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

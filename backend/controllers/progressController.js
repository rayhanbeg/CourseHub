import Progress from '../models/Progress.js';
import Course from '../models/Course.js';

// Get User Course Progress
export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    }).populate({
      path: 'lessons.lesson',
      select: 'title videoDuration',
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    res.status(200).json({
      success: true,
      progress,
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

    const lessonIndex = progress.lessons.findIndex(
      (l) => l.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Lesson not found in progress' });
    }

    if (isCompleted !== undefined) {
      progress.lessons[lessonIndex].isCompleted = isCompleted;
      if (isCompleted && !progress.lessons[lessonIndex].completedAt) {
        progress.lessons[lessonIndex].completedAt = new Date();
      }
    }

    if (watchTime !== undefined) {
      progress.lessons[lessonIndex].watchTime = watchTime;
    }

    // Calculate overall progress
    const completedLessons = progress.lessons.filter((l) => l.isCompleted).length;
    progress.overallProgress = Math.round(
      (completedLessons / progress.lessons.length) * 100
    );

    // Check if course is completed
    if (progress.overallProgress === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      progress,
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

    res.status(200).json({
      success: true,
      progress: progressList,
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

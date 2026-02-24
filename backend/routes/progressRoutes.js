import express from 'express';
import * as progressController from '../controllers/progressController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protected user routes
router.get('/course/:courseId', authMiddleware, progressController.getCourseProgress);
router.put('/lesson/:courseId/:lessonId', authMiddleware, progressController.updateLessonProgress);
router.get('/all/my-progress', authMiddleware, progressController.getAllUserProgress);

// Admin routes
router.get('/course/:courseId/students', authMiddleware, adminMiddleware, progressController.getCourseStudentsProgress);
router.get('/analytics/:courseId', authMiddleware, adminMiddleware, progressController.getCourseAnalytics);

export default router;

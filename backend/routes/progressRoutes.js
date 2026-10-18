import express from 'express';
import * as progressController from '../controllers/progressController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validateRequest.js';
import { validationSchemas } from '../utils/validation.js';

const router = express.Router();
for (const param of ['courseId', 'lessonId']) router.param(param, validateObjectIdParam(param));

// Protected user routes
router.get('/course/:courseId', authMiddleware, progressController.getCourseProgress);
router.get('/course/:courseId/certificate', authMiddleware, progressController.downloadCertificate);
router.put('/lesson/:courseId/:lessonId', authMiddleware, validateRequest({ body: validationSchemas.updateProgress }), progressController.updateLessonProgress);
router.get('/all/my-progress', authMiddleware, progressController.getAllUserProgress);

// Admin routes
router.get('/course/:courseId/students', authMiddleware, adminMiddleware, progressController.getCourseStudentsProgress);
router.get('/analytics/:courseId', authMiddleware, adminMiddleware, progressController.getCourseAnalytics);

export default router;

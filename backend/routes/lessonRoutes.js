import express from 'express';
import * as lessonController from '../controllers/lessonController.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/auth.js';
import { videoUpload, resourceUpload } from '../middleware/upload.js';
import { validationSchemas } from '../utils/validation.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validateRequest.js';
import verifyUploadSignature from '../middleware/verifyUploadSignature.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const streamLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many video stream requests. Try again shortly.' });
for (const param of ['id', 'moduleId']) router.param(param, validateObjectIdParam(param));

// Public routes
router.get('/:id/stream', streamLimiter, optionalAuthMiddleware, lessonController.getLessonStream);
router.get('/:id', optionalAuthMiddleware, lessonController.getLesson);
router.get('/module/:moduleId/all', optionalAuthMiddleware, lessonController.getModuleLessons);

// Protected routes (Admin only)
router.post('/upload/video', authMiddleware, adminMiddleware, videoUpload.single('video'), verifyUploadSignature('video'), lessonController.uploadLessonVideo);
router.post('/upload/resource', authMiddleware, adminMiddleware, resourceUpload.single('resource'), verifyUploadSignature('pdf'), lessonController.uploadLessonResource);
router.post('/', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.createLesson }), lessonController.createLesson);
router.put('/:id', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.updateLesson }), lessonController.updateLesson);
router.delete('/:id', authMiddleware, adminMiddleware, lessonController.deleteLesson);
router.post('/:id/resources', authMiddleware, adminMiddleware, lessonController.addResources);
router.delete('/:id/resource', authMiddleware, adminMiddleware, lessonController.removeResource);
router.put('/reorder/all', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.reorderLessons }), lessonController.reorderLessons);

export default router;

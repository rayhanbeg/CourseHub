import express from 'express';
import * as lessonController from '../controllers/lessonController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { videoUpload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/:id', lessonController.getLesson);
router.get('/module/:moduleId/all', lessonController.getModuleLessons);

// Protected routes (Admin only)
router.post('/upload/video', authMiddleware, adminMiddleware, videoUpload.single('video'), lessonController.uploadLessonVideo);
router.post('/', authMiddleware, adminMiddleware, lessonController.createLesson);
router.put('/:id', authMiddleware, adminMiddleware, lessonController.updateLesson);
router.delete('/:id', authMiddleware, adminMiddleware, lessonController.deleteLesson);
router.post('/:id/resources', authMiddleware, adminMiddleware, lessonController.addResources);
router.delete('/:id/resource', authMiddleware, adminMiddleware, lessonController.removeResource);
router.put('/reorder/all', authMiddleware, adminMiddleware, lessonController.reorderLessons);

export default router;
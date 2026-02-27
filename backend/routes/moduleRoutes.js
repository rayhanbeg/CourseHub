import express from 'express';
import * as moduleController from '../controllers/moduleController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/course/:courseId/all', moduleController.getCourseModules);
router.get('/:id', moduleController.getModule);

// Protected routes (Admin only)
router.put('/reorder/all', authMiddleware, adminMiddleware, moduleController.reorderModules);
router.post('/', authMiddleware, adminMiddleware, moduleController.createModule);
router.put('/:id', authMiddleware, adminMiddleware, moduleController.updateModule);
router.delete('/:id', authMiddleware, adminMiddleware, moduleController.deleteModule);

export default router;

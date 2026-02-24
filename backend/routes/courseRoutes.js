import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (must be before param routes)
router.post('/', authMiddleware, adminMiddleware, courseController.createCourse);
router.get('/instructor/my-courses', authMiddleware, adminMiddleware, courseController.getInstructorCourses);

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.get('/:id', courseController.getCourseById);

// Admin param routes
router.put('/:id', authMiddleware, adminMiddleware, courseController.updateCourse);
router.delete('/:id', authMiddleware, adminMiddleware, courseController.deleteCourse);

export default router;

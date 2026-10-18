import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/auth.js';
import { imageUpload, videoUpload } from '../middleware/upload.js';
import { validationSchemas } from '../utils/validation.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validateRequest.js';
import verifyUploadSignature from '../middleware/verifyUploadSignature.js';

const router = express.Router();
router.param('id', validateObjectIdParam('course id'));

// Admin routes (must be before param routes)
router.post('/', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.createCourse }), courseController.createCourse);
router.get('/instructor/my-courses', authMiddleware, adminMiddleware, courseController.getInstructorCourses);

router.post('/upload/thumbnail', authMiddleware, adminMiddleware, imageUpload.single('thumbnail'), verifyUploadSignature('image'), courseController.uploadCourseThumbnail);
router.post('/upload/intro-video', authMiddleware, adminMiddleware, videoUpload.single('video'), verifyUploadSignature('video'), courseController.uploadCourseIntroVideo);

// Public routes
router.get('/', validateRequest({ query: validationSchemas.courseListQuery }), courseController.getAllCourses);
router.get('/search', validateRequest({ query: validationSchemas.courseSearchQuery }), courseController.searchCourses);
router.get('/:id', optionalAuthMiddleware, courseController.getCourseById);

// Admin param routes
router.put('/:id', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.updateCourse }), courseController.updateCourse);
router.delete('/:id', authMiddleware, adminMiddleware, courseController.deleteCourse);

export default router;

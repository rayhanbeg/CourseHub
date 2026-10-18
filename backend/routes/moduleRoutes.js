import express from 'express';
import * as moduleController from '../controllers/moduleController.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/auth.js';
import { validationSchemas } from '../utils/validation.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
for (const param of ['id', 'courseId']) router.param(param, validateObjectIdParam(param));

// Public routes
router.get('/course/:courseId/all', optionalAuthMiddleware, moduleController.getCourseModules);
router.get('/:id', optionalAuthMiddleware, moduleController.getModule);


// Protected routes (Admin only)
router.put('/reorder/all', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.reorderModules }), moduleController.reorderModules);
router.post('/', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.createModule }), moduleController.createModule);
router.put('/:id', authMiddleware, adminMiddleware, validateRequest({ body: validationSchemas.updateModule }), moduleController.updateModule);
router.delete('/:id', authMiddleware, adminMiddleware, moduleController.deleteModule);

export default router;

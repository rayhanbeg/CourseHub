import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { getDashboardData } from '../controllers/adminController.js';
import { validationSchemas } from '../utils/validation.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
router.get('/dashboard', authMiddleware, adminMiddleware, validateRequest({ query: validationSchemas.dashboardQuery }), getDashboardData);
export default router;

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validationSchemas } from '../utils/validation.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest({ body: validationSchemas.registerUser }), authController.register);
router.post('/login', validateRequest({ body: validationSchemas.loginUser }), authController.login);
router.post('/refresh-token', validateRequest({ body: validationSchemas.refreshToken }), authController.refreshToken);
router.post('/forgot-password', validateRequest({ body: validationSchemas.forgotPassword }), authController.forgotPassword);
router.post('/reset-password', validateRequest({ body: validationSchemas.resetPassword }), authController.resetPassword);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, validateRequest({ body: validationSchemas.updateProfile }), authController.updateProfile);

export default router;

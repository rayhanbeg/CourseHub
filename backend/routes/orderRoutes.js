import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protected user routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/stripe/create-session', authMiddleware, orderController.createStripeSession);
router.post('/:id/confirm', authMiddleware, orderController.confirmOrderPayment);

// Webhook (public)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), orderController.handleStripeWebhook);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, orderController.getAllOrders);

export default router;

import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { validationSchemas } from '../utils/validation.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
router.param('id', validateObjectIdParam('order id'));

// Protected user routes
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id/receipt', authMiddleware, orderController.getOrderReceipt);
router.post('/stripe/create-session', authMiddleware, validateRequest({ body: validationSchemas.courseIdOnly }), orderController.createStripeSession);
router.post('/free-enroll', authMiddleware, validateRequest({ body: validationSchemas.courseIdOnly }), orderController.createOrder);
router.get('/:id', authMiddleware, orderController.getOrderById);

// Webhook (public)
router.post('/webhook/stripe', orderController.handleStripeWebhook);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, validateRequest({ query: validationSchemas.orderListQuery }), orderController.getAllOrders);

export default router;

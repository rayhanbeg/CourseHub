import dotenv from 'dotenv';

// Load environment variables FIRST before anything else
dotenv.config();

console.log(' Environment variables loaded');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';


import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);


const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set((process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean));

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be configured before the API can start.');
}
if (isProduction && (!process.env.FRONTEND_URL || !process.env.CORS_ORIGINS || allowedOrigins.size === 0 || [...allowedOrigins].some((origin) => /localhost|127\.0\.0\.1|replace-with/i.test(origin)))) {
  throw new Error('Production requires a non-local FRONTEND_URL and an explicit CORS_ORIGINS allowlist.');
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
// Stripe signature verification requires the original request bytes.
app.use('/api/orders/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true, parameterLimit: 100 }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  skip: (req) => req.path === '/webhook/stripe',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many authentication attempts. Try again later.' });
const paymentLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many payment requests. Try again later.' });

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use('/api/orders/stripe', paymentLimiter);
app.use('/api/orders/free-enroll', paymentLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

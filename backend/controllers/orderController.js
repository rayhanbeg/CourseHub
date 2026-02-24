import Order from '../models/Order.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const buildProgressLessons = async (courseId) => {
  const modules = await Module.find({ course: courseId }).select('lessons').populate('lessons', '_id');
  const lessons = [];

  modules.forEach((module) => {
    (module.lessons || []).forEach((lesson) => {
      lessons.push({
        lesson: lesson._id,
        isCompleted: false,
        watchTime: 0,
      });
    });
  });

  return lessons;
};

const finalizeEnrollment = async (order) => {
  if (!order || order.status === 'completed') return order;

  order.status = 'completed';
  order.enrollmentDate = order.enrollmentDate || new Date();
  await order.save();

  const user = await User.findById(order.student);
  const alreadyEnrolled = user.enrolledCourses.some((c) => c.courseId.toString() === order.course.toString());

  if (!alreadyEnrolled) {
    user.enrolledCourses.push({
      courseId: order.course,
      enrolledAt: new Date(),
    });
    await user.save();
    await Course.findByIdAndUpdate(order.course, { $inc: { enrollmentCount: 1 } });
  }

  let progress = await Progress.findOne({ student: order.student, course: order.course });
  if (!progress) {
    const lessonProgress = await buildProgressLessons(order.course);
    progress = new Progress({
      student: order.student,
      course: order.course,
      lessons: lessonProgress,
      overallProgress: 0,
      isCompleted: false,
    });
    await progress.save();
  }

  return order;
};

// Create Order (Initiate Payment)
export const createOrder = async (req, res, next) => {
  try {
    const { courseId, paymentMethod } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some((c) => c.courseId.toString() === courseId);
    if (isEnrolled) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    const existingPending = await Order.findOne({
      student: req.user._id,
      course: courseId,
      status: 'pending',
      paymentMethod,
    }).sort({ createdAt: -1 });

    if (existingPending) {
      return res.status(200).json({
        success: true,
        message: 'Existing pending order found',
        order: existingPending,
      });
    }

    const order = new Order({
      student: req.user._id,
      course: courseId,
      amount: course.price,
      paymentMethod,
      status: 'pending',
    });

    await order.save();

    res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (error) {
    next(error);
  }
};

// Create Stripe Checkout Session
export const createStripeSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('course student');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'stripe') return res.status(400).json({ message: 'Invalid payment method for this order' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: order.course.title,
              description: order.course.description,
            },
            unit_amount: Math.round(order.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/checkout-success?orderId=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout-cancel`,
      metadata: {
        orderId: orderId.toString(),
        userId: order.student._id.toString(),
        courseId: order.course._id.toString(),
      },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

// Confirm payment and enroll (fallback when webhook is delayed)
export const confirmOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to confirm this order' });
    }

    if (order.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Order already completed', order });
    }

    if (!order.stripeSessionId) {
      return res.status(400).json({ message: 'Stripe session not found for this order' });
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment is not completed yet' });
    }

    order.transactionId = session.payment_intent?.toString() || order.transactionId;
    await finalizeEnrollment(order);

    const populated = await Order.findById(order._id).populate('course', 'title thumbnail price');

    res.status(200).json({ success: true, message: 'Enrollment confirmed successfully', order: populated });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe Webhook
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const order = await Order.findOne({ stripeSessionId: session.id });

      if (order) {
        order.transactionId = session.payment_intent;
        await finalizeEnrollment(order);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'title description price');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('student', 'name email')
      .populate('course', 'title price')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

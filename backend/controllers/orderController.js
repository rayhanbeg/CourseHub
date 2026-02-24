import Order from '../models/Order.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Order (Initiate Payment)
export const createOrder = async (req, res, next) => {
  try {
    const { courseId, paymentMethod } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already enrolled
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some((c) => c.courseId.toString() === courseId);

    if (isEnrolled) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // Create order
    const order = new Order({
      student: req.user._id,
      course: courseId,
      amount: course.price,
      paymentMethod,
      status: 'pending',
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Create Stripe Checkout Session
export const createStripeSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('course student');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'stripe') {
      return res.status(400).json({ message: 'Invalid payment method for this order' });
    }

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

    // Update order with stripe session ID
    order.stripeSessionId = session.id;
    await order.save();

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe Webhook
export const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Find and update order
      const order = await Order.findOne({ stripeSessionId: session.id });

      if (order) {
        order.status = 'completed';
        order.transactionId = session.payment_intent;
        order.enrollmentDate = new Date();
        await order.save();

        // Enroll user in course
        const user = await User.findById(order.student);
        if (!user.enrolledCourses.some((c) => c.courseId.toString() === order.course.toString())) {
          user.enrolledCourses.push({
            courseId: order.course,
            enrolledAt: new Date(),
          });
          await user.save();
        }

        // Update course enrollment count
        await Course.findByIdAndUpdate(order.course, { $inc: { enrollmentCount: 1 } });

        // Create progress tracker
        const course = await Course.findById(order.course).populate('modules');
        const progress = new Progress({
          student: order.student,
          course: order.course,
          lessons: [],
        });

        if (course.modules.length > 0) {
          for (const module of course.modules) {
            if (module.lessons) {
              for (const lesson of module.lessons) {
                progress.lessons.push({
                  lesson,
                  isCompleted: false,
                  watchTime: 0,
                });
              }
            }
          }
        }

        await progress.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Get User Orders
export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// Get Order Details
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'title description price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (order.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get All Orders
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('student', 'name email')
      .populate('course', 'title price')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

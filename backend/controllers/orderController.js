import Order from '../models/Order.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import Stripe from 'stripe';
import StripeEvent from '../models/StripeEvent.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const buildProgressLessons = async (courseId) => {
  const modules = await Module.find({ course: courseId }).select('lessons').populate('lessons', '_id');
  return modules.flatMap((module) => (module.lessons || []).map((lesson) => ({ lesson: lesson._id, isCompleted: false, watchTime: 0 })));
};

const enroll = async (order) => {
  const changed = await User.updateOne(
    { _id: order.student, 'enrolledCourses.courseId': { $ne: order.course } },
    { $push: { enrolledCourses: { courseId: order.course, enrolledAt: new Date() } } }
  );
  if (changed.modifiedCount) await Course.updateOne({ _id: order.course }, { $inc: { enrollmentCount: 1 } });
  const lessons = await buildProgressLessons(order.course);
  await Progress.updateOne({ student: order.student, course: order.course }, { $setOnInsert: { student: order.student, course: order.course, lessons, overallProgress: 0, isCompleted: false } }, { upsert: true });
};

// A free course has no payment provider; the database price is checked again here.
export const createOrder = async (req, res, next) => {
  try {
    const course = await Course.findById(req.body.courseId);
    if (!course || !course.isPublished) return res.status(404).json({ message: 'Course not found' });
    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.some((item) => item.courseId.toString() === course.id)) return res.status(409).json({ message: 'You are already enrolled in this course' });
    if (course.price > 0) return res.status(400).json({ message: 'Paid courses must be purchased through Stripe Checkout' });

    let order = await Order.findOne({ student: user._id, course: course._id, paymentMethod: 'free' });
    if (!order) {
      try {
      order = await Order.create({ student: user._id, course: course._id, courseTitle: course.title, coursePrice: course.price, amount: 0, currency: (process.env.STRIPE_CURRENCY || 'usd').toUpperCase(), paymentMethod: 'free', status: 'completed', enrollmentDate: new Date() });
      } catch (error) {
        if (error.code !== 11000) throw error;
        order = await Order.findOne({ student: user._id, course: course._id, paymentMethod: 'free' });
      }
    }
    if (order && (!order.courseTitle || order.coursePrice == null)) { order.courseTitle = order.courseTitle || course.title; order.coursePrice = order.coursePrice ?? course.price; await order.save(); }
    await enroll(order);
    res.status(200).json({ success: true, order });
  } catch (error) { next(error); }
};

// Only courseId is accepted. The amount and currency always come from server configuration and MongoDB.
export const createStripeSession = async (req, res, next) => {
  try {
    const course = await Course.findById(req.body.courseId);
    if (!course || !course.isPublished) return res.status(404).json({ message: 'Course not found' });
    if (course.price <= 0) return res.status(400).json({ message: 'Free courses do not use Stripe Checkout' });
    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.some((item) => item.courseId.toString() === course.id)) return res.status(409).json({ message: 'You are already enrolled in this course' });

    let order = await Order.findOne({ student: user._id, course: course._id, status: { $in: ['pending', 'failed'] }, paymentMethod: 'stripe' }).sort({ createdAt: -1 });
    if (!order) {
      try {
      order = await Order.create({ student: user._id, course: course._id, courseTitle: course.title, coursePrice: course.price, amount: course.price, currency: (process.env.STRIPE_CURRENCY || 'usd').toUpperCase(), paymentMethod: 'stripe', status: 'pending' });
      } catch (error) {
        if (error.code !== 11000) throw error;
        order = await Order.findOne({ student: user._id, course: course._id, status: 'pending', paymentMethod: 'stripe' });
      }
    }
    if (!order.courseTitle || order.coursePrice == null) { order.courseTitle = order.courseTitle || course.title; order.coursePrice = order.coursePrice ?? course.price; await order.save(); }
    if (order.stripeSessionId) {
      const existing = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
      if (existing.status === 'open' && existing.url) {
        if (order.status === 'failed') { order.status = 'pending'; await order.save(); }
        return res.json({ success: true, url: existing.url });
      }
      if (existing.status === 'complete') return res.status(409).json({ message: 'Payment confirmation is processing. Check your order history shortly.' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['card'],
      line_items: [{ price_data: { currency: order.currency.toLowerCase(), product_data: { name: course.title, description: course.shortDescription || course.description }, unit_amount: Math.round(order.amount * 100) }, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/checkout-success?orderId=${order.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout-cancel?orderId=${order.id}`,
      metadata: { orderId: order.id, userId: user.id, courseId: course.id },
      payment_intent_data: { metadata: { orderId: order.id, userId: user.id, courseId: course.id } },
    }, { idempotencyKey: `checkout-${order.id}-${order.sessionAttempt || 0}` });
    order.stripeSessionId = session.id;
    order.status = 'pending';
    order.sessionAttempt = (order.sessionAttempt || 0) + 1;
    await order.save();
    res.json({ success: true, url: session.url });
  } catch (error) { next(error); }
};

const processStripeEvent = async (event) => {
  const object = event.data.object;
  if (event.type === 'checkout.session.completed') {
    if (object.payment_status !== 'paid') return;
    const order = await Order.findOne({ stripeSessionId: object.id });
    if (!order) throw new Error('No order matches the completed Checkout Session');
    if (object.metadata?.orderId !== order.id || object.metadata?.userId !== order.student.toString() || object.metadata?.courseId !== order.course.toString() || Number(object.amount_total) !== Math.round(order.amount * 100) || object.currency?.toUpperCase() !== order.currency) throw new Error('Checkout Session does not match its order');
    if (order.status === 'completed') return;
    // A declined card can be retried inside the same hosted Checkout Session.
    if (!['pending', 'failed'].includes(order.status)) return;
    order.transactionId = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id;
    order.stripePaymentIntentId = order.transactionId;
    if (order.stripePaymentIntentId) {
      try {
        const intent = await getStripe().paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ['latest_charge'] });
        const card = intent.latest_charge?.payment_method_details?.card;
        if (card) { order.cardBrand = card.brand || null; order.cardLast4 = card.last4 || null; }
      } catch (error) { console.warn('Stripe card details unavailable for receipt:', error.message); }
    }
    await enroll(order);
    order.status = 'completed';
    order.enrollmentDate = new Date();
    order.paidAt = new Date();
    await order.save();
  } else if (event.type === 'payment_intent.payment_failed') {
    const order = await Order.findOne(object.metadata?.orderId ? { _id: object.metadata.orderId } : { stripePaymentIntentId: object.id });
    if (order?.status === 'pending') { order.stripePaymentIntentId = object.id; order.failedAt = new Date(); order.status = 'failed'; await order.save(); }
  } else if (event.type === 'charge.refunded') {
    const intentId = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id;
    const order = await Order.findOne({ stripePaymentIntentId: intentId });
    if (order && order.status !== 'refunded') {
      const card = object.payment_method_details?.card;
      if (card) { order.cardBrand = card.brand || order.cardBrand; order.cardLast4 = card.last4 || order.cardLast4; }
      order.status = 'refunded'; order.refundedAt = new Date(); order.stripeChargeId = object.id; await order.save();
      const removed = await User.updateOne({ _id: order.student, 'enrolledCourses.courseId': order.course }, { $pull: { enrolledCourses: { courseId: order.course } } });
      if (removed.modifiedCount) await Course.updateOne({ _id: order.course, enrollmentCount: { $gt: 0 } }, { $inc: { enrollmentCount: -1 } });
      await Progress.deleteOne({ student: order.student, course: order.course });
    }
  }
};

export const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) { return res.status(400).send(`Webhook Error: ${error.message}`); }
  try {
    await StripeEvent.create({ eventId: event.id, type: event.type });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ received: true, duplicate: true });
    return res.status(500).json({ message: 'Could not record Stripe event' });
  }
  try {
    await processStripeEvent(event);
    await StripeEvent.updateOne({ eventId: event.id }, { $set: { processedAt: new Date() } });
    return res.status(200).json({ received: true });
  } catch (error) {
    await StripeEvent.deleteOne({ eventId: event.id });
    console.error('Stripe webhook processing failed:', error.message);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user._id }).populate('course', 'title thumbnail price').sort({ createdAt: -1 });
    const missingSnapshots = orders.filter((order) => !order.courseTitle || order.coursePrice == null);
    await Promise.all(missingSnapshots.map(async (order) => {
      order.courseTitle = order.course?.title || order.courseTitle || 'Course no longer available';
      if (order.coursePrice == null) order.coursePrice = order.course?.price ?? order.amount;
      await order.save();
    }));
    res.json({ success: true, orders });
  } catch (error) { next(error); }
};

export const getOrderReceipt = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('student', 'name email').populate('course', 'title');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const ownerId = order.student?._id?.toString();
    if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to download this receipt' });
    if (!['completed', 'refunded'].includes(order.status)) return res.status(409).json({ message: 'Receipts are available after payment is completed or refunded' });

    const PDFDocument = (await import('pdfkit')).default;
    const receiptNumber = `CH-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-8).toUpperCase()}`;
    const money = (amount, currency) => {
      try { return `${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0))} ${currency}`; }
      catch { return `${Number(amount || 0).toFixed(2)} ${currency || 'USD'}`; }
    };
    const doc = new PDFDocument({ size: 'A4', margin: 52, info: { Title: `CourseHub receipt ${receiptNumber}`, Author: 'CourseHub' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CourseHub-Receipt-${receiptNumber}.pdf"`);
    doc.pipe(res);
    const ink = '#171717'; const muted = '#686868'; const line = '#E8E5E0';
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(17).text('CourseHub', 52, 48);
    doc.font('Helvetica').fontSize(12).text('Receipt', 395, 48, { align: 'right' });
    doc.fillColor(muted).fontSize(9).text(receiptNumber, 340, 66, { width: 107, align: 'right' });
    doc.moveTo(52, 96).lineTo(543, 96).strokeColor(line).lineWidth(1).stroke();

    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('ISSUED', 52, 119);
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 52, 134);
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('STATUS', 270, 119);
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(order.status === 'refunded' ? 'Refunded' : 'Paid', 270, 134);
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('BILLED TO', 52, 182);
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(11).text(order.student?.name || 'Student', 52, 199);
    doc.font('Helvetica').fontSize(10).fillColor(muted).text(order.student?.email || '', 52, 216);

    let title = order.courseTitle || order.course?.title || 'Course no longer available';
    const amount = Number(order.amount || 0);
    doc.moveTo(52, 270).lineTo(543, 270).strokeColor(line).stroke();
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('DESCRIPTION', 52, 285);
    doc.text('QTY', 393, 285, { width: 40, align: 'right' });
    doc.text('AMOUNT', 450, 285, { width: 93, align: 'right' });
    doc.moveTo(52, 303).lineTo(543, 303).strokeColor(line).stroke();
    doc.fillColor(ink).font('Helvetica').fontSize(10);
    while (title.length > 8 && doc.widthOfString(title) > 315) title = `${title.slice(0, -5).trimEnd()}…`;
    doc.text(title, 52, 322, { width: 315, lineBreak: false });
    doc.text('1', 393, 322, { width: 40, align: 'right' });
    doc.text(money(amount, order.currency), 450, 322, { width: 93, align: 'right' });
    doc.moveTo(52, 354).lineTo(543, 354).strokeColor(line).stroke();
    doc.fillColor(muted).fontSize(10).text('Subtotal', 355, 373, { width: 95 });
    doc.fillColor(ink).text(money(amount, order.currency), 450, 373, { width: 93, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).text('Total', 355, 400, { width: 95 });
    doc.text(money(amount, order.currency), 450, 400, { width: 93, align: 'right' });
    doc.moveTo(52, 430).lineTo(543, 430).strokeColor(line).stroke();

    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('PAYMENT', 52, 455);
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(order.paymentMethod === 'stripe' ? 'Stripe' : 'Free enrollment', 52, 472);
    if (order.cardBrand && order.cardLast4) doc.fillColor(muted).text(`${order.cardBrand.toUpperCase()} ending in ${order.cardLast4}`, 52, 488);
    if (order.stripePaymentIntentId) doc.fillColor(muted).text(`Payment reference ${order.stripePaymentIntentId.slice(-12).toUpperCase()}`, 52, 504);
    const paymentDate = order.refundedAt || order.paidAt || order.createdAt;
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text(order.status === 'refunded' ? 'REFUND DATE' : 'PAYMENT DATE', 340, 455);
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(new Date(paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 340, 472);

    doc.moveTo(52, 730).lineTo(543, 730).strokeColor(line).stroke();
    doc.fillColor(muted).font('Helvetica').fontSize(9).text(`Thank you for learning with CourseHub.${process.env.SUPPORT_EMAIL ? `  Support: ${process.env.SUPPORT_EMAIL}` : ''}`, 52, 746, { width: 491, align: 'center' });
    doc.end();
  } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('student', 'name email').populate('course', 'title description price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to view this order' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, from, to, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};
    if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    const orders = await Order.find(filter).populate('student', 'name email').populate('course', 'title price').skip((page - 1) * limit).limit(parseInt(limit, 10)).sort({ createdAt: -1 });
    const total = await Order.countDocuments(filter);
    res.json({ success: true, total, page: parseInt(page, 10), pages: Math.ceil(total / limit), orders });
  } catch (error) { next(error); }
};

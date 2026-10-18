import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseTitle: { type: String, default: '', trim: true },
    coursePrice: { type: Number, default: null },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'free'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeChargeId: { type: String, default: null },
    cardBrand: { type: String, default: null },
    cardLast4: { type: String, default: null },
    sessionAttempt: { type: Number, default: 0 },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    enrollmentDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ student: 1, course: 1 }, { unique: true, partialFilterExpression: { status: 'pending', paymentMethod: 'stripe' } });
OrderSchema.index({ student: 1, course: 1 }, { unique: true, partialFilterExpression: { paymentMethod: 'free' } });

export default mongoose.model('Order', OrderSchema);

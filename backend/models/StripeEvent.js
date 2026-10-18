import mongoose from 'mongoose';

const StripeEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('StripeEvent', StripeEventSchema);

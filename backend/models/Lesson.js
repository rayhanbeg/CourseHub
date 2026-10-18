import mongoose from 'mongoose';

const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a lesson title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    videoPublicId: { type: String, default: '' },
    videoFormat: { type: String, default: 'mp4' },
    videoDeliveryType: { type: String, enum: ['upload', 'authenticated'], default: 'authenticated' },
    videoDuration: {
      type: Number,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    resources: [
      {
        title: String,
        url: String,
      },
    ],
    sequenceNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Lesson', LessonSchema);

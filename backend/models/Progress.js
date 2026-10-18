import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema(
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
    lessons: [
      {
        lesson: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lesson',
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        watchTime: {
          type: Number,
          default: 0,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: { type: Number, default: 0, min: 0 },
    totalLessons: { type: Number, default: 0, min: 0 },
    lastLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastPosition: { type: Number, default: 0, min: 0 },
    certificateId: { type: String },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ProgressSchema.index({ student: 1, course: 1 }, { unique: true });
ProgressSchema.index({ certificateId: 1 }, { unique: true, partialFilterExpression: { certificateId: { $type: 'string' } } });

export default mongoose.model('Progress', ProgressSchema);

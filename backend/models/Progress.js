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

export default mongoose.model('Progress', ProgressSchema);

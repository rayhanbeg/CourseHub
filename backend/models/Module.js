import mongoose from 'mongoose';

const ModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a module title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
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

export default mongoose.model('Module', ModuleSchema);

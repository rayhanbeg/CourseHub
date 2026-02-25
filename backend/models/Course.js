import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    thumbnail: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'],
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    language: {
      type: String,
      default: 'English',
    },
    duration: {
      type: Number,
      default: 0,
    },

    introVideoUrl: {
      type: String,
      default: '',
    },
    introVideoPublicId: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Course', CourseSchema);
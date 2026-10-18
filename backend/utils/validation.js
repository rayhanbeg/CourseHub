import Joi from 'joi';

const validationSchemas = {
  // User Validation
  registerUser: Joi.object({
    name: Joi.string().required().max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
  }),

  loginUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
  }),
  refreshToken: Joi.object({ refreshToken: Joi.string().optional() }),
  updateProfile: Joi.object({
    name: Joi.string().trim().min(1).max(50).required(),
    bio: Joi.string().allow('').max(500).required(),
    profileImage: Joi.string().uri().allow('', null).required(),
  }),

  // Course Validation
  createCourse: Joi.object({
    title: Joi.string().required().max(100),
    description: Joi.string().optional().allow(''),
    shortDescription: Joi.string().optional().allow('').max(240),
    fullDescription: Joi.string().optional().allow(''),
    learningOutcomes: Joi.array().items(Joi.string().trim().max(240)).optional(),
    thumbnail: Joi.string().optional().allow(''),
    price: Joi.number().required().min(0),
    category: Joi.string().valid('Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other').required(),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').required(),
    language: Joi.string().optional().allow(''),
    duration: Joi.number().optional().min(0),
    introVideoUrl: Joi.string().uri().optional().allow(''),
    introVideoPublicId: Joi.string().optional().allow(''),
    isPublished: Joi.boolean().optional(),
    instructor: Joi.string().optional(),
  }).or('description', 'fullDescription'),

  updateCourse: Joi.object({
    title: Joi.string().max(100),
    description: Joi.string(),
    shortDescription: Joi.string().allow('').max(240),
    fullDescription: Joi.string().allow(''),
    learningOutcomes: Joi.array().items(Joi.string().trim().max(240)),
    thumbnail: Joi.string().allow(''),
    introVideoUrl: Joi.string().uri().allow(''),
    introVideoPublicId: Joi.string().allow(''),
    language: Joi.string().allow(''),
    duration: Joi.number().min(0),
    price: Joi.number().min(0),
    category: Joi.string().valid('Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    isPublished: Joi.boolean(),
  }).min(1),

  // Module Validation
  createModule: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    courseId: Joi.string().required(),
    sequenceNumber: Joi.number().required(),
  }),
  updateModule: Joi.object({
    title: Joi.string().trim().min(1).max(120),
    description: Joi.string().allow('').max(2000),
    sequenceNumber: Joi.number().integer().min(1),
  }).min(1),
  reorderModules: Joi.object({ courseId: Joi.string().hex().length(24).required(), moduleIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required() }),

  // Lesson Validation
  createLesson: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    videoUrl: Joi.string().allow('').optional(),
    videoPublicId: Joi.string().allow('').optional(),
    videoFormat: Joi.string().allow('').optional(),
    videoDuration: Joi.number(),
    isPreview: Joi.boolean().optional(),
    resources: Joi.array().items(Joi.object({ title: Joi.string().allow(''), url: Joi.string().allow('') })).optional(),
    moduleId: Joi.string().required(),
    sequenceNumber: Joi.number().required(),
  }),
  updateLesson: Joi.object({
    title: Joi.string().trim().min(1).max(160),
    description: Joi.string().allow('').max(5000),
    videoUrl: Joi.string().uri().allow(''),
    videoPublicId: Joi.string().allow(''),
    videoFormat: Joi.string().allow(''),
    videoDuration: Joi.number().min(0),
    isPreview: Joi.boolean(),
    sequenceNumber: Joi.number().integer().min(1),
    resources: Joi.array().items(Joi.object({ title: Joi.string().trim().min(1).max(160).required(), url: Joi.string().uri().required() }).unknown(false)),
  }).min(1),
  reorderLessons: Joi.object({ moduleId: Joi.string().hex().length(24).required(), lessonIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required() }),

  // Order Validation
  createOrder: Joi.object({
    courseId: Joi.string().required(),
    paymentMethod: Joi.string().valid('stripe', 'free').required(),
  }),
  courseIdOnly: Joi.object({ courseId: Joi.string().hex().length(24).required() }),
  updateProgress: Joi.object({ isCompleted: Joi.boolean(), watchTime: Joi.number().min(0) }).min(1),
  dashboardQuery: Joi.object({ range: Joi.string().valid('7d', '30d', '90d', '12m').default('30d') }),
  courseListQuery: Joi.object({
    category: Joi.string().valid('Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
    sort: Joi.string().valid('newest', 'popular', 'price').default('newest'),
  }).unknown(false),
  courseSearchQuery: Joi.object({
    query: Joi.string().trim().max(120).allow(''),
    category: Joi.string().valid('Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(false),
  orderListQuery: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded'),
    from: Joi.date().iso(),
    to: Joi.date().iso().min(Joi.ref('from')),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(false),
};

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return { isValid: false, errors: details };
  }
  return { isValid: true, value };
};

export { validationSchemas, validate };

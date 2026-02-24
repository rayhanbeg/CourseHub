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

  // Course Validation
  createCourse: Joi.object({
    title: Joi.string().required().max(100),
    description: Joi.string().required(),
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
  }),

  updateCourse: Joi.object({
    title: Joi.string().max(100),
    description: Joi.string(),
    thumbnail: Joi.string(),
    price: Joi.number().min(0),
    category: Joi.string().valid('Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    isPublished: Joi.boolean(),
  }),

  // Module Validation
  createModule: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    courseId: Joi.string().required(),
    sequenceNumber: Joi.number().required(),
  }),

  // Lesson Validation
  createLesson: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    videoUrl: Joi.string().required(),
    videoDuration: Joi.number(),
    isPreview: Joi.boolean().optional(),
    resources: Joi.array().items(Joi.object({ title: Joi.string().allow(''), url: Joi.string().allow('') })).optional(),
    moduleId: Joi.string().required(),
    sequenceNumber: Joi.number().required(),
  }),

  // Order Validation
  createOrder: Joi.object({
    courseId: Joi.string().required(),
    paymentMethod: Joi.string().valid('stripe', 'sslcommerz').required(),
  }),
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

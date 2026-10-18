import mongoose from 'mongoose';

const validateRequest = ({ body, query } = {}) => (req, res, next) => {
  if (body) {
    const result = body.validate(req.body, { abortEarly: false, stripUnknown: false });
    if (result.error) return res.status(400).json({ message: 'Validation failed', errors: result.error.details.map(({ path, message }) => ({ field: path.join('.'), message })) });
    req.body = result.value;
  }
  if (query) {
    const result = query.validate(req.query, { abortEarly: false, convert: true });
    if (result.error) return res.status(400).json({ message: 'Invalid query parameters', errors: result.error.details.map(({ path, message }) => ({ field: path.join('.'), message })) });
    req.validatedQuery = result.value;
  }
  return next();
};

const validateObjectIdParam = (name) => (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) return res.status(400).json({ message: `Invalid ${name}` });
  return next();
};

export { validateRequest, validateObjectIdParam };

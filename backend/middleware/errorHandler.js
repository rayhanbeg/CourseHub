const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (process.env.NODE_ENV !== 'production') console.error(err);

  // Validation error
  if (err.errors) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: process.env.NODE_ENV === 'production' ? undefined : err.errors,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message || 'Internal Server Error',
  });
};

export default errorHandler;

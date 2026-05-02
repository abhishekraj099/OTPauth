const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  console.error('GLOBAL ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  logger.error(err.message, { stack: err.stack, url: req.url });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: err.timestamp,
    });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate entry' });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;

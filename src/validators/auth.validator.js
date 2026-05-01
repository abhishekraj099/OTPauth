const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(422, 'Validation failed', errors.array());
  next();
};

const sendOtpValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail().isLength({ max: 255 }),
  validate,
];

const verifyOtpValidator = [
  body('email').isEmail().normalizeEmail().isLength({ max: 255 }),
  body('otp').isNumeric().withMessage('OTP must be numeric').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
  validate,
];

module.exports = { sendOtpValidator, verifyOtpValidator, refreshTokenValidator };

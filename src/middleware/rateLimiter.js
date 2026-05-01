const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many verification attempts.' },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: 'Too many requests' },
});

module.exports = { otpLimiter, verifyLimiter, globalLimiter };

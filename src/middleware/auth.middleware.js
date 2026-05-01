const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next(new ApiError(401, 'No token provided'));
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    next(new ApiError(401, msg));
  }
};

module.exports = { authenticate };

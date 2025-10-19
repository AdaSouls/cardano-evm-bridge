const httpStatus = require('http-status');
const ApiError = require('../util/ApiError');
const config = require('../config/config');

const devOnly = (req, res, next) => {
  if (config.env === "production") {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'This endpoint is not available in production.');
  }
  return next();
};

module.exports = devOnly;

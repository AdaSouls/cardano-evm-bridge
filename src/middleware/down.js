const httpStatus = require('http-status');
const ApiError = require('../util/ApiError');
const config = require('../config/config');

const checkDown = (req, res, next) => {
  if (config.appState.down && config.appState.whitelist.indexOf(req.ip) < 0) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, config.appState.downMsg || 'Service unavailable.');
  }

  return next();
};

module.exports = checkDown;

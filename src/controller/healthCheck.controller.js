const httpStatus = require("http-status");
const catchAsync = require("../util/catchAsync");

/**
 * Simply send an OK/200.
 */
const healthCheck = catchAsync(async (req, res) => {
  const healthcheck = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  };

  res.status(httpStatus.OK).send(healthcheck);
});

module.exports = {
  healthCheck,
};

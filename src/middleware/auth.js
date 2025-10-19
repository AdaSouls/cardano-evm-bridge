const httpStatus = require('http-status');
const ApiError = require('../util/ApiError');
const authService = require('../service/auth.service');
const userService = require('../service/user.service');

const checkAuthenticated = (req, res, next) => {

  if (req.isAuthenticated()) {
    return next();
  }

  throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
};

const checkUserIsAdmin = async (req, res, next) => {
  let authInfo = await authService.checkMvAuth(req);

  if (!authInfo.valid) {
    res.status(httpStatus.UNAUTHORIZED).send({
      status: 400,
      message: 'JWT is not valid'
    });
  }

  // The verification comes from the motorverse hub
  user = await userService.getUserByMvAuthKey(
    authInfo.jwt.sub
  );

  if (!user) {
    // No user by key, let's try by wallet:
    res.status(httpStatus.NOT_FOUND).send({
      status: 404,
      message: 'User not found'
    });
  }

  if (user.dataValues.role === 'admin') {
    return next();
  }

  res.status(httpStatus.UNAUTHORIZED).send({
    status: 401,
    message: 'User is not an admin'
  });

};

module.exports = {
  checkAuthenticated,
  checkUserIsAdmin,
}

const httpStatus = require('http-status');

/**
 * Stash errors.
 */
let errorStatus;
let errorMsg;
let errorReason;


/*
|--------------------------------------------------------------------------
| Stashing errors.
|--------------------------------------------------------------------------
*/

/**
 * Stash an error.
 * @param {int} status
 * @param {string} msg
 * @param {string} reason
 */
const stashError = (status, msg = null, reason = null) => {
  errorStatus = status;
  errorMsg = msg;
  errorReason = reason;
};

/**
 * Stash UNAUTHORIZED.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const stashUnauthorized = (msg = 'Unauthorized', reason = null) => {
  stashError(httpStatus.UNAUTHORIZED, msg, reason);
};

/**
 * Stash NOT_FOUND.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const stashNotFound = (msg = null, reason = null) => {
  stashError(httpStatus.NOT_FOUND, msg, reason);
};

/**
 * Stash BAD_REQUEST.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const stashBadRequest = (msg = null, reason = null) => {
  stashError(httpStatus.BAD_REQUEST, msg, reason);
};

/**
 * Stash FORBIDDEN.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const stashForbidden = (msg = null, reason = null) => {
  stashError(httpStatus.FORBIDDEN, msg, reason);
};

/**
 * Stash INTERNAL_SERVER_ERROR.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const stashInternalError = (msg = null, reason = null) => {
  stashError(httpStatus.INTERNAL_SERVER_ERROR, msg, reason);
};

/**
 * Stash INTERNAL_SERVER_ERROR from an exception.
 * @param {object} res
 * @param {string} msg
 */
function stashInternalErrorFromException(e, leadin = '') {
  stashError(httpStatus.INTERNAL_SERVER_ERROR, `${leadin}${e.message}`);
}

/**
 * Get last error status.
 *
 * @return {int}
 */
const getLastErrorStatus = () => {
  return errorStatus;
};

/**
 * Get last error message.
 *
 * @return {string}
 */
const getLastErrorMsg = () => {
  return errorMsg;
};

/**
 * Get last error reason.
 *
 * @return {string}
 */
const getLastErrorReason = () => {
  return errorReason;
};

/**
 * Emit a stashed error.
 */
const emitStashedError = (res) => {
  res.status(errorStatus, errorMsg).json({ status: errorStatus, message: errorMsg, reason: errorReason });
};


/*
|--------------------------------------------------------------------------
| Helpers to emit errors straight away.
|--------------------------------------------------------------------------
*/

/**
 * Emit UNAUTHORIZED.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const unauthorized = (res, msg = 'Unauthorized', reason = null) => {
  res.status(httpStatus.UNAUTHORIZED).json({ status: httpStatus.UNAUTHORIZED, message: msg, reason: reason });
};

/**
 * Emit NOT_FOUND.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const notFound = (res, msg = null, reason = null) => {
  res.status(httpStatus.NOT_FOUND).json({ status: httpStatus.NOT_FOUND, message: msg, reason: reason });
};

/**
 * Emit BAD_REQUEST.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const badRequest = (res, msg = null, reason = null) => {
  res.status(httpStatus.BAD_REQUEST).json({ status: httpStatus.BAD_REQUEST, message: msg, reason: reason });
};

/**
 * Emit FORBIDDEN.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const forbidden = (res, msg = null, reason = null) => {
  res.status(httpStatus.FORBIDDEN).json({ status: httpStatus.FORBIDDEN, message: msg, reason: reason });
};

/**
 * Emit INTERNAL_SERVER_ERROR.
 * @param {object} res
 * @param {string} msg
 * @param {string} reason
 */
const internalError = (res, msg = null, reason = null) => {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: httpStatus.INTERNAL_SERVER_ERROR, message: msg, reason: reason });
};


module.exports = {
  stashError,
  stashUnauthorized,
  stashNotFound,
  stashBadRequest,
  stashForbidden,
  stashInternalError,
  stashInternalErrorFromException,
  getLastErrorStatus,
  getLastErrorMsg,
  getLastErrorReason,
  emitStashedError,
  unauthorized,
  notFound,
  badRequest,
  forbidden,
  internalError,
};

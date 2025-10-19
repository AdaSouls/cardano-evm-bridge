const { rateLimit } = require("express-rate-limit");
const postgresStores = require('@acpr/rate-limit-postgresql')
const config = require('../config/config');
const authService = require('../service/auth.service');
const errorService = require('../service/error.service');

let user, password, host, ssl;

if (config.postgresql.url) {
  let string = config.postgresql.url.split("@");
  user = string[0].split("postgres://")[1].split(":")[0];
  password = string[0].split("postgres://")[1].split(":")[1];
  host = string[1].split("/")[0];
  database = string[1].split("/")[1];
} else {
  user = config.postgresql.user;
  password = config.postgresql.password;
  host = config.postgresql.host;
  database = config.postgresql.database;
}

if (config.env === 'local') {
  ssl = undefined;
} else {
  ssl = {
    require: true,
    rejectUnauthorized: false,
  }
}

// Rate limit middleware
const rateLimitMiddleware = rateLimit({
   store: new postgresStores.PostgresStore(
    {
      user,
      password,
      host,
      database,
      port: 5432,
      ssl
    },
    'aggregated_store',
  ),
  keyGenerator: async (req, res) => {
    let authInfo = await authService.checkMvAuth(req);
    if (!authInfo.valid) {
      errorService.unauthorized(res, authInfo.code, authInfo.reason);
      return;
    }
    let functionName = req.url.split('?')[0].substring(1);
    return `${authInfo.jwt.sub}+${functionName}`
  },
  windowMs: 60 * 60 * 24 * 1000,
  max: parseInt(config.rate.limit),
  message: "You have exceeded the number of permitted requests per day.",
  headers: true,
});

module.exports = rateLimitMiddleware;

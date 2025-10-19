const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const xss = require("xss-clean");
const httpStatus = require("http-status");
const config = require("./config/config");
const morgan = require("./config/morgan");
const routesV1 = require("./route/v1");
const { errorConverter, errorHandler } = require("./middleware/error");
const checkDown = require("./middleware/down");
const ApiError = require("./util/ApiError");
const app = express();

// morgan logger
if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
if (config.frontendUrl2) {
  app.use(
    cors({
      credentials: true,
      origin: [config.frontendUrl, config.frontendUrl2 || ""],
    })
  );
} else {
  app.use(cors({ credentials: true, origin: config.frontendUrl }));
}
app.options("*", cors());

// see "Troubleshooting Proxy" section here https://www.npmjs.com/package/express-rate-limit
app.set("trust proxy", 2);
app.get("/ip45v", (request, response) =>
  response.send({ ip: request.ip, trustLevel: 2 })
); // a helper route to calc the correct value for "trust proxy"

// check if app is currently down
app.use(checkDown);

// v1 api routes
app.use("/api/v1", routesV1);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;

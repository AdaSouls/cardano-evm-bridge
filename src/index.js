const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const bridgeService = require("../src/service/bridge.service")
let server;

/*
|--------------------------------------------------------------------------
| Error handling.
|--------------------------------------------------------------------------
*/

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

server = app.listen(config.port, () => {
  logger.info(`Listening to port ${config.port}`);
  bridgeService.listenBurnEvents();
});

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});

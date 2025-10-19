const express = require("express");
const router = express.Router();
const config = require("../../config/config");
const healthCheckRoute = require("./healthCheck.route");
const webhookRoute = require("./webhook.route");

const defaultRoutes = [
  {
    path: "/healthCheck",
    route: healthCheckRoute,
  },
  {
    path: "/webhook",
    route: webhookRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env !== "production") {
  const devRoutes = [
    // routes available only in development mode
  ];

  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;

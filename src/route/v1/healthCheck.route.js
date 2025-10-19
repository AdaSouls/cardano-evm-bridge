const express = require('express');
const router = express.Router();
const healthCheckController = require('../../controller/healthCheck.controller');

router.route('').get(healthCheckController.healthCheck);

module.exports = router;

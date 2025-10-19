const express = require("express");
const router = express.Router();
const bridgeController = require("../../controller/bridge.controller");

router.route("/blockfrost/aldeaLockEvent").post(bridgeController.aldeaLockEvent);
router.route("/blockfrost/aldeaBridgeEvent").post(bridgeController.aldeaBridgeEvent);

module.exports = router;

const express = require("express");
const router = express.Router();
const sensorApi = require("./sensor.api");
const stateApi = require("./carState.api");


router.use("/sensor", sensorApi);
router.use("/carState", stateApi);

module.exports = router;

const express = require("express");
const router = express.Router();
const sensorApi = require("./sensor.api");

router.use("/sensor", sensorApi);


module.exports = router;

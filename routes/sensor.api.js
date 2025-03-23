const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController"); 

router.get("/", sensorController.getData);
router.post("/", sensorController.postData);
router.get("/esp32", sensorController.checkConnection);

module.exports = router;
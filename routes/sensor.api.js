const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController"); 

router.get("/", sensorController.getData);
router.post("/", sensorController.resetData);

module.exports = router;
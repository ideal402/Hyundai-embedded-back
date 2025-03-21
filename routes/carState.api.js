const express = require("express");
const router = express.Router();
const carStateController = require("../controllers/carStateController"); 

router.get("/", carStateController.getState);
router.post("/", carStateController.postState);

module.exports = router;
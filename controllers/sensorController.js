const sensorController = {};
const Sensor = require("../models/Sensor");
const WebSocket = require("ws");
const { getWebClient } = require("../websocket"); 

let lastSensorUpdateTime = null;

sensorController.getData = async(req, res) => {
    try{
        const recentData = await Sensor.find()
            .sort({createdAt:-1})
            .limit(60);

        res.status(200).json({status: "success", data:recentData});
    }catch(error){
        res.status(400).json({status: "fail", error: error.message});
    }
}

sensorController.postData = async(req, res) => {
    try{
        let{temperature, humidity, motorSpeed, illuminance} = req.body;
        
        const newSensor = new Sensor({temperature, humidity, motorSpeed, illuminance});
        await newSensor.save();
        
        lastSensorUpdateTime = Date.now();
        const webClient = getWebClient();
        if (webClient?.readyState === WebSocket.OPEN){
            webClient.send(JSON.stringify({type: "sensor", payload: newSensor}));
        }
        res.status(200).json({status:"success"});
    }catch(error){
        res.status(400).json({status: "fail", error: error.message});
    }
}

sensorController.checkConnection = (req, res) => {
    const now = Date.now();
    const THRESHOLD = 3000; // 3초 기준
  
    const connected =
      lastSensorUpdateTime && now - lastSensorUpdateTime <= THRESHOLD;
  
    res.status(200).json({ connected });
  };

module.exports = sensorController;
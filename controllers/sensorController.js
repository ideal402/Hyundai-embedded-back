const sensorController = {};
const Sensor = require("../models/Sensor");

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

        res.status(200).json({status:"success"});
    }catch(error){
        res.status(400).json({status: "fail", error: error.message});
    }
}


module.exports = sensorController;
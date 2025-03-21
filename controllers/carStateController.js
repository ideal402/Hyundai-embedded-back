const carStateController = {}
const CarState = require("../models/CarState");

carStateController.getState = async(req, res) => {
    try{
        let latestState = await CarState.findOne().sort({ createdAt: -1 });

        if (!latestState) {
            latestState = new CarState({
                isAnomaly: false,
                isACActive: false,
                isSunroofOpen: false,
                isCarDoorOpen: false
            });

            await latestState.save(); 
        }

        res.status(200).json({ status: "success", data: latestState });
    
    }catch(error){
        res.status(400).json({status:"fail", error: error.message});
    }
}

carStateController.postState = async(req, res) => {
    try{
        let{isAnomaly,isACActive,isSunroofOpen,isCarDoorOpen} = req.body;

        const newState = new CarState({isAnomaly,isACActive,isSunroofOpen,isCarDoorOpen});

        await newState.save();

        res.status(200).json({status:"success", data: newState});
    }catch(error){
        res.status(400).json({status:"fail", error: error.message});
    }
}

module.exports = carStateController;
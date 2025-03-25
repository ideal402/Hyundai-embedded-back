const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carStateSchema = Schema({
    isAnomaly: {type: Boolean, required: true},
    isACActive: {type: Boolean, required: true},
    isSunroofOpen: {type: Boolean, required: true},
    isCarDoorOpen: {type: Boolean, required: true},
    isDriving: {type: Boolean, required: true},
    isActive: {type: Boolean, required: true},
},
{timestamps: true}
);

carStateSchema.methods.toJSON = function(){
    const obj = this._doc;
    delete obj.__v;

    return obj;
}

module.exports = mongoose.model("CarState", carStateSchema);
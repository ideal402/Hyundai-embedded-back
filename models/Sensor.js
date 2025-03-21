const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sensorSchema = Schema({
    temperature: {type: Number, required: true},
    humidity: {type: Number, required: true},
    motorSpeed: {type: Number, required: true},
    illuminance: {type: Number, required: true},
},
{timestamps: true}
);

sensorSchema.methods.toJSON = function(){
    const obj = this._doc;
    delete obj.__v;

    return obj;
}

module.exports = mongoose.model("Sensor", sensorSchema);
var mongoose = require('mongoose');

var deviceSchema =  new mongoose.Schema({
    deviceId : String,
    customerId : String,
    platform : String,
    token : String
});

module.exports = mongoose.model('Device', deviceSchema);
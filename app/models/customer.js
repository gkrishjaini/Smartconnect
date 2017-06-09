var mongoose = require('mongoose');
extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');
var userSchema = require('./user');

var customerSchema = userSchema.extend({
    addressLane1: String,
    addressLane2: String,
    city: String,
    state: String,
    areaCode: String,
    mobilePhone: String,
    email: String,
    country: String,
    zipCode: String,
    areaOfInterest: String,
    timeZone: String,
    timeFormat: String,
    termAndConditionsAccepted: Boolean,
    isAdmin: Boolean
});

module.exports = mongoose.model('Customers', customerSchema);
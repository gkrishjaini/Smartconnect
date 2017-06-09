var mongoose = require('mongoose'),
extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');

var employeeSchema = new mongoose.Schema({
    employeeID: String,
    employeeName: String
}, { _id: false });

var questionSchema = new mongoose.Schema({
    question: String,
    id: String,
    required : Boolean
}, { _id: false });

var appointSchema = new mongoose.Schema({
    appointmentName: String,
    appointmentId: String,
    appointmentType: String,
    appointmentCategory: String,
    appointmentSubCategory: String,
    numberofEmployees: String,
    averageAppoinmentTime: String,
    startTime: String,
    endTime: String,
    spot: Boolean,
    status: String,
    effectiveFrom: Date,
    effectiveTo: Date,
    breakstartTime: String,
    breakendTime: String,
    timeZone: String,
    timeFormat: String,
    serviceProviderId: String,
    startTimeutcDayDiff: String,
    endTimeutcDayDiff: String,
    bstartTimeutcDayDiff: String,
    bendTimeutcDayDiff: String,
    employees: [employeeSchema],
    questions :[questionSchema]
});

mongoose.model('appointmentDefinitions', appointSchema);

module.exports = appointSchema;
// customer appointment shedule
var mongoose = require('mongoose'),
extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');

var answersSchema = new mongoose.Schema({
    question: String,
    answer: String
}, { _id: false });

var appointmentSheduleSchema = new mongoose.Schema({
    customerID: String,
    customerName: String,
    apointmentId: String,
    appointmentName: String,
    appRefNo : String,
    serviceProviderID: String,
    appointmentDate: String,
    appointmentTime: String,
    appointmentTime24: String,
    appointmentDatetime24 :String,
    employeeId: String,
    answers : [answersSchema],
    time: String,
    spot: Boolean,
    sequenceNumber : String,
    attended : {
        type: String,
        default: 'Pending'
    },
    comments: String,
    status: {
    	type: String,
    	default: 'pending'
    }
});

mongoose.model('appointmentShedule', appointmentSheduleSchema);

module.exports = appointmentSheduleSchema;
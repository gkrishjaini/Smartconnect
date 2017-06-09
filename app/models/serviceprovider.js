var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');
var userSchema = require('./user');
/*
var securityQuestionSchema = new mongoose.Schema({
    question: String,
    answer: String
}, {
        _id: false
    });*/
var serviceProviderSchema = userSchema.extend({
    // _id: mongoose.Schema.Types.ObjectId,
    /*   firstName: String,
       lastName: String,
       
       userName: {
           type: String,
           required: true,
           index: {
               unique: true
           }
       },
       password: {
           type: String,
           required: true,
           select: false
       },*/
    companyName: String,
    taxId: String,
    addressLane1: String,
    addressLane2: String,
    businessArea: String,
    businessCategory: String,
    city: String,
    state: String,
    areaCode: String,
    mobilePhone: String,
    email: String,
    country: String,
    zipCode: String,
    contactPerson: String,
    contactPhone: String,
    termAndConditionsAccepted: Boolean,
    isAdmin: Boolean,
    //  termsAndConditions: Boolean,
    //  securityQuestions: [securityQuestionSchema],
    timeZone: String,
    timeFormat: String,
    appointmentOption: String,
    reason: String,

    appointmentId: String
    //   verificationCode: String
});

/*
serviceProviderSchema.pre('save', function (next) {
    var entity = this;
    if (!entity.isModified('password')) {
        return next();
    }

    bcrypt.hash(entity.password, null, null, function (err, hash) {
        if (err) return next(err);

        console.log('hashed password is ' + hash);
        // change the password to the hashed version
        entity.password = hash;
        next();
    });
});*/

module.exports = mongoose.model('ServiceProviders', serviceProviderSchema);

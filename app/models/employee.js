var mongoose = require('mongoose');
extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');
var userSchema = require('./user');

var employeeSchema = userSchema.extend({
    // firstName: String,
    // lastName: String,
    // userName: {
    //     type: String,
    //     required: true,
    //     index: {
    //         unique: true
    //     }
    // },
    // password: {
    //     type: String,
    //     required: true,
    //     select: false
    // },
    serviceProviderId: String,
    effectiveFrom: Date,
    effectiveTo: Date,
    role: String,
    designation: String,
    description: String,
    status: String,
    timeZone: String,
    timeFormat: String,
    renderService: Boolean,
    superUser: Boolean,
    startTime: String,
    endTime: String,
    breakTime: String
});

// employeeSchema.pre('save', function(next) {
//     var entity = this;
//     if (!entity.isModified('password')) {
//         return next();
//     }

//     bcrypt.hash(entity.password, null, null, function(err, hash) {
//         if (err) return next(err);

//         console.log('hashed password is ' + hash);
//         // change the password to the hashed version
//         entity.password = hash;
//         next();
//     });
// });

// employeeSchema.methods.comparePassword = function(password) {
//     var entity = this;
//     console.log('comparing password ' + password);
//     console.log('hashed password ' + entity.password);
//     return bcrypt.compareSync(password, entity.password);
// };

module.exports = mongoose.model('Employees', employeeSchema);

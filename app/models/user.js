var mongoose = require('mongoose'),
extend = require('mongoose-schema-extend');
var bcrypt = require('bcrypt-nodejs');
var autoIncrement = require('mongoose-auto-increment');
var config = require('../../config');

var securityQuestionSchema = new mongoose.Schema({
    question: String,
    answer: String
}, { _id: false });

var userSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    gender: String,
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
    },
    termsAndConditions: Boolean,
    securityQuestions: [securityQuestionSchema],
    verificationCode: String,
    profilePicUrl: String,
    EmailVerified:{
        type:'boolean',
        defaultsTO:'false',
        boolean:true
    },
    approved: {
        type: String,
        default: 'pending'
    },
    uniqueId :{
        type : Number,
        default :1
    }
},{ collection : 'users' });

userSchema.pre('save', function(next) {
    var entity = this;


    if (!entity.isModified('password')) {
        return next();
    }

    bcrypt.hash(entity.password, null, null, function(err, hash) {
        if (err) return next(err);

        console.log('hashed password is ' + hash);
        // change the password to the hashed version
        entity.password = hash;
        next();
    });
});

userSchema.methods.comparePassword = function (password) {
    var entity = this;
    console.log('comparing password ' + password);
    console.log('hashed password ' + entity.password);
    return bcrypt.compareSync(password, entity.password);
};


var connection = mongoose.createConnection(config.database);
autoIncrement.initialize(connection); 
connection.model('User', userSchema);
userSchema.plugin(autoIncrement.plugin, {model : 'User', field: 'uniqueId'});  
module.exports = userSchema;

var mongoose = require('mongoose');
var sparkpost = require('sparkpost');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var user = require('../models/user');
var appointment = require('../models/AppointmentDefinitions');
var device = require('../models/deviceDetails');
var ServiceProviderRatings = require('../models/ServiceProviderRating');
var SeriveProviders = require('../models/serviceprovider');
var Customers = require('../models/customer');
var userCollection = mongoose.model('User', user);
var LookUpData = require('../models/lookup');
var deviceCollection = mongoose.model('Device', device);
var appointmentCollection = mongoose.model('Appointment', appointment);
var ServiceProviderRating = mongoose.model('ServiceProviderRating', ServiceProviderRatings);

var FCM = require('fcm-push');

var client = new sparkpost(config.sparkpostKey);
var moment = require('moment');


var twilio = require('twilio');
var SMSclient = new twilio.RestClient(config.twilio.accountSid, config.twilio.authToken);

var bcrypt = require('bcrypt-nodejs');

var SeriveProvidersContent = require('../models/serviceProviderContent');
var KnowledgebaseContent = require('../models/knowledgebaseContent');
var closingAttachmentContent = require('../models/closingAttachmentContent')

var multer = require('multer');
var _ = require('underscore');

var TOKEN_SECRET_STRING = config.secret;

module.exports = function (app, express) {

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './public/uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    var knowledgestorage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './public/uploads/knowledgebase/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var knowledgebaseupload = multer({ //multer settings
        storage: knowledgestorage
    }).single('file');

    var userProfilePics = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './public/uploads/profilepics/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var userProfilePics = multer({ //multer settings
        storage: userProfilePics
    }).single('file');

    var closingAttachmentUploadStorage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './public/uploads/closingAttachments')
        },
        filename: function (req, file, cb) {
            console.log(file)//file.fieldname +
            var datetimestamp = Date.now();
            cb(null, Math.floor((Math.random() * 1000000) + 1) + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var closingAttachmentUpload = multer({ //multer settings
        storage: closingAttachmentUploadStorage
    }).any();


    var apiRouter = express.Router();


    apiRouter.post('/authenticate', function (req, res) {

        userCollection.findOne({
            'userName': req.body.userName
        }).select(' _id __t firstName lastName userName password effectiveTo appointmentOption EmailVerified effectiveFrom isAdmin approved uniqueId profilePicUrl appointmentOption appointmentId ')
            .exec(function (err, entity) {

                
                if (err) throw err;
                if (!entity) {
                    res.json({
                        success: false,
                        message: 'Authentication failed, user not found'
                    });
                } else {
                    var isPasswordValid = entity.comparePassword(req.body.password);
                    if (!isPasswordValid) {
                        res.json({
                            success: false,
                            message: 'Authentication failed, invalid password'
                        });
                    } else {

                        var flag = true;

                        if (entity.__t != 'Employees') {
                            if (!entity.EmailVerified) {
                                return res.json({
                                    success: false,
                                    message: 'Please verify your email to sign in!'
                                });
                            }
                        }

                        if (entity.__t == 'Employees') {

                            var effectiveTo = entity.effectiveTo.toISOString();
                            var effectiveFrom = entity.effectiveFrom.toISOString();
                            var nowDate = new Date();

                            if (nowDate <= entity.effectiveTo && nowDate >= entity.effectiveFrom) {
                                flag = true;
                            } else {
                                flag = false;
                                res.json({
                                    success: false,
                                    message: 'Sorry, Your scheduled date has been expired or not yet ready!'
                                });
                            }
                        }

                        if (entity.__t === 'ServiceProviders' && entity.isAdmin != true && (entity.approved == 'pending' || entity.approved == 0 || entity.approved == 'Rejected')) {
                            flag = false;
                            res.json({
                                success: false,
                                message: 'Sorry, You are not approved yet.Please contact Administrator!'
                            });
                        }



                        if (entity.__t === 'Customers' && req.body.device == "true") {
                            deviceCollection.findOne({ customerId: entity._id, platform: req.body.platform }, function (err, customer) {
                                if (customer != null) {
                                    if (customer.deviceId != req.body.deviceId) {
                                        deviceCollection.update({
                                            customerId: entity._id,
                                            platform: req.body.platform
                                        }, {
                                                $set: {
                                                    deviceId: req.body.deviceId,
                                                    token: req.body.token
                                                }
                                            }, function (err, result) {
                                                if (err) {
                                                    return res.send(err);
                                                }
                                            })
                                    }
                                } else {
                                    var device = new deviceCollection();
                                    device.deviceId = req.body.deviceId;
                                    device.customerId = entity._id;
                                    device.platform = req.body.platform;
                                    device.token = req.body.token;
                                    device.save(function (err) {
                                        if (err) {
                                            return res.send(err);
                                        }
                                    })
                                }
                            });
                        }

                        if (entity.__t === 'ServiceProviders' && req.body.device == "true") {
                            deviceCollection.findOne({ customerId: entity._id, platform: req.body.platform }, function (err, customer) {
                                if (customer != null) {
                                    if (customer.deviceId != req.body.deviceId) {
                                        deviceCollection.update({
                                            customerId: entity._id,
                                            platform: req.body.platform
                                        }, {
                                                $set: {
                                                    deviceId: req.body.deviceId,
                                                    token: req.body.token
                                                }
                                            }, function (err, result) {
                                                if (err) {
                                                    return res.send(err);
                                                }
                                            })
                                    }
                                } else {
                                    var device = new deviceCollection();
                                    device.deviceId = req.body.deviceId;
                                    device.customerId = entity._id;
                                    device.platform = req.body.platform;
                                    device.token = req.body.token;
                                    device.save(function (err) {
                                        if (err) {
                                            return res.send(err);
                                        }
                                    })
                                }
                            });
                        }

                        if (flag) {

                            var jwtToken = jwt.sign({
                                name: entity.firstName + ' ' + entity.lastName,
                                userName: entity.userName,
                                id: entity._id,
                                corporateLogin: entity.isAdmin,
                                type: entity.__t || 'Admin',
                                uniqueid: entity.uniqueId,
                                profilePicUrl: entity.profilePicUrl,
                                appointmentOption: entity.appointmentOption
                            }, TOKEN_SECRET_STRING, {
                                    expiresIn: 86400
                                });
                            console.log(entity.appointmentOption)
                            res.json({
                                success: true,
                                message: 'User authenticated and the jwt token generated',
                                token: jwtToken,
                                type: entity.__t
                            });
                        }
                    }
                }
            });

    });



    apiRouter.get('/regularLookups/:lookup_type', function (req, res) {
        LookUpData.find({ type: req.params.lookup_type }, function (err, lookupdata) {
            res.send(lookupdata)
        })
    });



    // apiRouter.get('/timezone', function(req, res){

    //     utc = localToUtc('2016-11-14 10:00 am', -480, ' hh:mm a');

    //     local = utcToLocal(utc.full, 330, ' hh:mm a')

    //     res.send({utc, local})


    // })


    apiRouter.get('/usernameValidation/:username', function (req, res) {
        userCollection.findOne({ 'userName': new RegExp('^' + req.params.username + '$', "i") }).exec(function (err, entity) {
            if (err) throw err;
            if (entity) {
                res.json({
                    success: true,
                    message: 'User name already taken'
                });
            } else {
                res.json({
                    success: false
                });
            }
        });
    });

    apiRouter.post('/SMSRequest/:userid/mobileNumber/:mobile_number', function (req, res) {

        // generate verification code and store it into database (not resend code)


        // Send generated verification code to mobilenumer 
        SMSclient.messages.create({
            to: req.params.mobile_number, // original to  mobile number -> req.params.mobile_number
            from: '+12082446629',
            body: 'verify mobile numer - code', // generated verifcation code with message
        }, function (err, message) {
            if (err) {
                console.log(err.message);
            } else {
                console.log(message.sid);
                res.json({
                    success: true
                });
            }

        });

    });

    apiRouter.post('/passwordReset', function (req, res) {

        var select = '',
            data = {};
        if (req.body.phase == 'checkUsername') {
            data = {
                'userName': req.body.userName
            };
            // select = "securityQuestions.question";
        } else if (req.body.phase == 'checkSecurityQuestions' || req.body.phase == 'changePassword') {
            data = {
                'userName': req.body.userName,
                'securityQuestions': req.body.securityQuestions
            };
        } else if (req.body.phase == 'checkVerification') {
            data = {
                'userName': req.body.userName,
                //[req.body.method]: req.body.values
            };
        } else if (req.body.phase == 'checkVerificationKey' || req.body.phase == 'changePassword') {
            data = {
                'userName': req.body.userName,
                // [req.body.method]: req.body.values,
                'verificationCode': req.body.verificationCode,
            };
        } else if (req.body.phase == 'changePasswordbyEmail') {
            data = {
                '_id': req.body.id

            };
        } else if (req.body.phase == 'changePasswordbyOTP') {
            data = {
                'userName': req.body.userName
            };
        }

        userCollection.findOne(data).select(select).exec(function (err, entity) {
            if (err) throw err;
            if (!entity) {
                res.json({
                    success: false,
                    message: 'Invalid username, user not found!'
                });
            } else {

                if (req.body.phase == 'checkUsername') {
                    var secQuestions;
                    if (entity.securityQuestions)
                        secQuestions = entity.securityQuestions
                    else
                        secQuestions = null;
                    res.json({
                        success: true,
                        securityQuestions: secQuestions
                    });
                }
                if (req.body.phase == 'checkSecurityQuestions') {
                    var flag = true;
                    if (req.body.securityQuestions.length == 0)
                        flag = false;
                    res.json({
                        success: flag
                    });
                }
                if (req.body.phase == 'checkVerification') {
                    // Generate verification key and store it into database
                    var varificationKey = Math.floor(Math.random() * 90000) + 10000;
                    userCollection.update({
                        _id: entity.id
                    }, {
                            $set: {
                                verificationCode: varificationKey
                            }
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                return res.send(err);
                            } else {
                                if (req.body.method == "email") {
                                    var link = "http://" + req.headers.host + "/changepassword/" + varificationKey + "/" + entity.id;
                                    client.transmissions.send({
                                        transmissionBody: {
                                            content: {
                                                from: 'support@weresol.com',
                                                subject: 'Change Password',
                                                html: 'Hello ' + entity.firstName + ',<br><br> Please click on the link to change your password.<br><a href="' + link + '">Click here </a>'
                                            },
                                            recipients: [
                                                { address: entity.userName }
                                            ]
                                        }
                                    },
                                        function (err, res) {
                                            if (err) {
                                                console.log('oops something went wrong');
                                            } else {
                                                console.log('Success :Mail send');
                                            }
                                        });
                                }
                                res.send({
                                    success: true,
                                    message: "Password reset link send to your registered email."
                                });

                            }
                        });
                }

                if (req.body.phase == 'changePassword') {
                    if (req.body.securityQuestions.length != 0) {
                        bcrypt.hash(req.body.password, null, null, function (err, hash) {

                            userCollection.update({
                                _id: entity.id
                            }, {
                                    $set: {
                                        password: hash
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                        return res.send(err);
                                    }
                                });

                            res.json({
                                success: true
                            });

                        });
                    }
                }

                if (req.body.phase == 'changePasswordbyEmail') {
                    if (req.body.code == entity.verificationCode) {
                        var varificationKey = Math.floor(Math.random() * 90000) + 10000;
                        bcrypt.hash(req.body.password, null, null, function (err, hash) {
                            userCollection.update({
                                _id: entity.id
                            }, {
                                    $set: {
                                        password: hash,
                                        verificationCode: varificationKey
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                        return res.send(err);
                                    }
                                });

                            res.send({
                                success: true,
                                message: "Password changed successfully."
                            });
                        });
                    } else {
                        res.send({
                            success: false,
                            message: "Invalid verification code or code already used once"
                        })
                    }
                }

                if (req.body.phase == 'changePasswordbyOTP') {
                    bcrypt.hash(req.body.password, null, null, function (err, hash) {
                        userCollection.findOneAndUpdate({
                            userName: req.body.userName
                        }, {
                                $set: {
                                    password: hash,
                                }
                            }, function (err, user) {
                                if (err) {
                                    console.log(err);
                                    return res.send(err);
                                } else {
                                    if (user != null) {
                                        res.send({
                                            success: true,
                                            message: "Password changed successfully."
                                        });
                                    } else {
                                        res.send({
                                            success: false,
                                            message: "User not found or something wrong"
                                        });
                                    }
                                }
                            });
                    });
                }
            }
        });
    });

    apiRouter.post('/passwordReset/OTP/:userId/:flag', function (req, res) {
        if (req.params.flag == "send") {
            var varificationKey = Math.floor(Math.random() * 90000) + 10000;
            userCollection.findOneAndUpdate({ userName: req.params.userId }, {
                $set: {
                    verificationCode: varificationKey
                }
            }, function (err, user) {
                if (err) {
                    return res.send(err)
                }
                if (user != null) {
                    SMSclient.messages.create({
                        to: user.areaCode + user.mobilePhone,
                        from: '+12082446629',
                        body: 'Hi! ' + varificationKey + ' is the verification code to change your password'
                    }, function (err, message) {
                        if (err) {
                            res.json({
                                success: false,
                                message: "Something worng"
                            });
                        } else {
                            res.json({
                                success: true,
                                message: "OTP send successfully"
                            });
                        }
                    });

                } else {
                    res.json({
                        success: false,
                        message: "User Not Found"
                    });
                }
            })
        } else {
            userCollection.findOne({ userName: req.params.userId, verificationCode: req.params.flag }, function (err, user) {
                if (err) {
                    return res.send(err);
                }
                if (user != null) {
                    res.send({ success: true, message: "OTP verified successfully" })
                } else {
                    res.send({ success: false, message: "OTP verification failed or invalid OTP" })
                }
            });
        }
    });


    apiRouter.get('/searchServiceProviders/:keyWord', function (req, res) {

        var like = { '$regex': new RegExp('^' + req.params.keyWord), '$options': 'i' };

        userCollection.find({ firstName: like, __t: 'ServiceProviders' }, function (err, entity) {
            if (err) {
                return res.send(err);
            }
            res.send(entity);
        });
    });


    apiRouter.route('/uploadProfilePicture')
        .post(function (req, res) {

            userProfilePics(req, res, function (err) {
                if (err) {
                    res.json({ error_code: 1, err_desc: err });
                    return;
                }

                if (req.body.user) {
                    userCollection.findOneAndUpdate({ _id: req.body.user }, {
                        $set: {
                            profilePicUrl: req.file.filename
                        }
                    }, function (err, user) {
                        res.json({ success: true, path: req.file.destination, name: req.file.filename });
                    });
                } else {
                    res.json({ error_code: 0, err_desc: null, path: req.file.destination, name: req.file.filename });
                }

            });
        });

    apiRouter.get('/verify/:code/:id', function (req, res) {

        userCollection.findById(req.params.id, function (err, doc) {
            if (err || !doc) {
                res.send({
                    message: "Invalid Verification Credentials"
                })
            } else {
                if (doc.verificationCode == req.params.code) {
                    userCollection.update({
                        _id: req.params.id
                    }, {
                            $set: {
                                EmailVerified: true
                            }
                        }, function (err, data) {

                            if (err) {
                                return res.send(err);
                            }

                            userCollection.findById({ _id: req.params.id }, function (error, user) {

                                if (error) {
                                    return res.send(err);
                                }

                                if (user.type == 'Customers') {
                                    return res.send({
                                        message: "Email verified successfully; Thanks for completing email verification process. Your Service Provider account is now pending for approval. You will get an email once your account is approved."
                                    })
                                } else {
                                    return res.send({
                                        message: 'Email verified successfully! Please <a href="http://' + req.headers.host + '">login</a> using your user name and password.'
                                    })
                                }

                            })

                        });
                } else {
                    res.send({
                        message: "Invalid verification code"
                    })
                }
            }
        });
    });



    apiRouter.route('/serviceprovider')
        .post(function (req, res) {

            userCollection.findOne({ userName: new RegExp('^' + req.body.userName + '$', "i") }, function (err, entity) {
                if (entity) {
                    return res.json({
                        success: false,
                        message: 'A user with that username already exists. '
                    });
                } else {
                    var model = new SeriveProviders();
                    model.firstName = req.body.firstName;
                    model.lastName = req.body.lastName;
                    model.userName = req.body.userName;
                    model.password = req.body.password;
                    model.companyName = req.body.companyName;
                    model.areaCode = req.body.areaCode;
                    model.mobilePhone = req.body.mobilePhone;
                    model.email = req.body.email;
                    model.country = req.body.country;
                    model.zipCode = req.body.zipCode;
                    model.termsAndConditions = req.body.termsAndConditions;
                    var rand = Math.floor((Math.random() * 90000) + 10000);
                    model.verificationCode = rand;
                    model.isAdmin = false;
                    model.EmailVerified = false;
                    model.profilePicUrl = req.body.profilePicUrl;

                    model.save(function (err, room) {
                        if (err) {
                            return res.send(err);
                        } else {
                            var id = room._id;
                            var link = "http://" + req.headers.host + "/verify/" + rand + "/" + id;
                            client.transmissions.send({
                                transmissionBody: {
                                    content: {
                                        from: 'support@weresol.com',
                                        subject: 'Please verify your Account',
                                        html: 'Hello ' + req.body.firstName + ',<br><br> Please Click on the link to verify your email.<br><a href="' + link + '">Click here to verify</a>'
                                    },
                                    recipients: [
                                        { address: req.body.userName }
                                    ]
                                }
                            },
                                function (err, res) {
                                    if (err) {
                                        console.log('oops something went wrong');
                                    } else {
                                        console.log('Success :Mail send');
                                    }
                                });
                        }
                        res.json({
                            success: true,
                            message: 'User created!'
                        });
                    });
                }
            });

        }).get(function (req, res) {
            SeriveProviders.find(function (err, users) {
                if (err) {
                    res.send(err);
                } console.log(users)
                res.json(users);

            });
        });

    apiRouter.route('/serviceprovider/search/')
        .post(function (req, res) {
            var queries = req.body,
                query = {},
                query1 = {};

            for (var key in queries.data) {

                if (queries.data.hasOwnProperty(key)) {
                    var trim = queries.data[key].replace(/ /g, '');
                    if (trim)
                        query[key] = { '$regex': queries.data[key], '$options': 'i' };
                }
            }

            if (queries.type == "ServiceProviders") {
                findQuery = { __t: queries.type, approved: 1, EmailVerified: true }
            } else {
                findQuery = { __t: queries.type, EmailVerified: true };
            }


            if (Object.keys(query).length) {
                userCollection.find({ '$and': [{ '$and': [query] }, findQuery] }).select(' _id __t userName firstName lastName zipCode country email mobilePhone areaCode  uniqueId approved profilePicUrl appointmentOption appointmentId addressLane1 addressLane2 city state').lean().exec(function (err, entity) {
                    if (err) {
                        res.send(err);
                    }

                    if (queries.type == 'ServiceProviders') {

                        var spIds = _.pluck(entity, '_id');

                        ServiceProviderRating.find({ serviceProviderId: { $in: spIds } }).select('serviceProviderId rating').exec(function (err, rating) {
                            if (err) {
                                return res.send(err);
                            }

                            var groups = _(rating).groupBy('serviceProviderId');

                            var counts = _.countBy(rating, 'serviceProviderId');

                            var avgRating = _(groups).map(function (g, key) {
                                return {
                                    'serviceProviderId': key,
                                    rating: _(g).reduce(function (m, x) {
                                        return parseFloat(m) + parseFloat(x.rating);
                                    }, 0) / counts[key]
                                };
                            });
                            _.each(entity, function (item) {
                                _.each(avgRating, function (ratingItem) {
                                    if (item._id == ratingItem.serviceProviderId) {
                                        item.rating = ratingItem.rating
                                    }
                                })
                            })
                            res.json(entity);
                        });

                    } else {
                        res.json(entity);
                    }
                });
            }
        });

    apiRouter.route('/serviceprovider/appointments/')
        .post(function (req, res) {

            var serviceProviderId = req.body.data.serviceProviderId;
            userCollection.findById(serviceProviderId, function (err, user) {
                if (user.appointmentOption == 'Default' || user.appointmentOption == 'Contact') {

                    appointmentCollection.findById({ _id: user.appointmentId }).lean().exec(function (err, appointment) {

                        if (err) {
                            return res.send(err);
                        }
                        var details = {};
                        if (appointment != null) {
                            details = {
                                breakEndTime: appointment.breakendTime,
                                startTime: appointment.startTime,
                                endTime: appointment.endTime,
                                breakStartTime: appointment.breakstartTime,
                                effectiveFrom: appointment.effectiveFrom,
                                averageAppoinmentTime: appointment.averageAppoinmentTime,
                                appointmentId: user.appointmentId,
                                displayAppointmentId: appointment.appointmentId,
                                employees: [],
                                questions: appointment.questions
                            }
                        }

                        if (user.appointmentOption == 'Default') {
                            return res.json({ status: 'Default', details: details });
                        } else {
                            return res.json({ status: 'Contact' });
                        }

                    });

                } else if (user.appointmentOption == 'Regular') {
                    var nowDate = new Date(),
                        select = '';

                    if (req.body.method == 'names')
                        select = 'appointmentName';
                    if (req.body.method == 'category')
                        select = 'appointmentCategory';
                    if (req.body.method == 'subCategory')
                        select = 'appointmentSubCategory';
                    if (req.body.method == 'type')
                        select = 'appointmentType';
                    if (req.body.method == 'employee')
                        select = 'employees';


                    appointmentCollection.find({
                        '$and': [{
                            effectiveFrom: { $lte: nowDate }
                        }, {
                            effectiveTo: { $gte: nowDate }
                        }, req.body.data]
                    }).select('_id ' + select).exec(function (err, entity) {

                        if (err) {
                            res.send(err);
                        }

                        list = entity;
                        var pure = [];
                        list.forEach(function (item) {
                            var flag = true;
                            pure.forEach(function (item2) {
                                if (item[select] == item2[select]) flag = false;
                            });
                            if (flag) pure.push(item);
                        });
                        if (req.body.method == 'names') {
                            return res.json(entity);
                        } else {
                            return res.json(pure);
                        }
                    });
                }
            })




        });

    apiRouter.use(function (req, res, next) {

        console.log('call reached the node server for api calls');

        var token = req.body.token || req.param('token') || req.headers['x-access-token'];

        if (token) {
            jwt.verify(token, TOKEN_SECRET_STRING, function (err, decoded) {

                if (err) {
                    return res.status(403).send({
                        success: true,
                        message: 'Token authentication failed, please login again'
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            return res.status(403).send({
                success: true,
                message: 'No token provied!!'
            });
        }

        //next();
    });

    apiRouter.get('/', function (req, res) {
        //  res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ message: 'The api is up and running' }));
        res.json({
            message: 'The api is up and running'
        });
    });

    apiRouter.get('/me', function (req, res) {
        res.send(req.decoded);
    });

    apiRouter.route('/serviceprovider/uploads')
        .post(function (req, res) {

            upload(req, res, function (err) {
                if (err) {
                    res.json({ error_code: 1, err_desc: err });
                    return;
                }
                var model = new SeriveProvidersContent();
                model.url = req.file.destination;
                model.fileName = req.file.filename;
                model.serviceProviderId = req.body.userid;
                model.type = req.file.mimetype;

                model.save(function (err) {
                    if (err) {
                        return res.send(err);
                    }
                });

                res.json({ error_code: 0, err_desc: null });
            });
        });

    apiRouter.route('/serviceprovider/knowledgebaseuploads')
        .post(function (req, res) {

            knowledgebaseupload(req, res, function (err) {
                if (err) {
                    res.json({ error_code: 1, err_desc: err });
                    return;
                }
                var model = new KnowledgebaseContent();
                model.url = req.file.destination;
                model.fileName = req.file.filename;
                model.serviceProviderId = req.body.userid;
                model.appointmentId = req.body.appointmentId;
                model.type = req.file.mimetype;

                model.save(function (err) {
                    if (err) {
                        return res.send(err);
                    }
                });

                res.json({ error_code: 0, err_desc: null });
            });
        });

    apiRouter.route('/serviceprovider/closingAttachmentUploads')
        .post(function (req, res) {

            closingAttachmentUpload(req, res, function (err) {

                if (err) {
                    res.json({ error_code: 1, err_desc: err });
                    return;
                }

                for (i = 0; i < req.files.length; i++) {
                    var file = req.files[i];

                    var model = new closingAttachmentContent();
                    model.url = file.destination;
                    model.fileName = file.filename;
                    model.employeeId = req.body.empId;
                    model.appointmentId = req.body.appointmentId;
                    model.type = file.mimetype;

                    model.save(function (err) {
                        if (err) {
                            return res.send(err);
                        }
                    });
                }

                res.json({ error_code: 0, err_desc: null });
            });
        });

    apiRouter.route('/serviceprovider/:provider_id/uploads').get(function (req, res) {
        SeriveProvidersContent.find({ 'serviceProviderId': req.params.provider_id }, function (err, entity) {
            if (err) {
                res.send(err);
            }

            res.send(entity);
        });


    });

    apiRouter.route('/serviceprovider/appointmentDefinition/:appointId/uploads/:provider_id').get(function (req, res) {

        KnowledgebaseContent.find({ $and: [{ 'serviceProviderId': req.params.provider_id }, { 'appointmentId': req.params.appointId }] }, function (err, entity) {
            if (err) {
                res.send(err);
            }
            res.send(entity);
        });

    });
    apiRouter.route('/serviceprovider/:provider_id/uploads/:content_id').delete(function (req, res) {
        SeriveProvidersContent.remove({ _id: req.params.content_id, serviceProviderId: req.params.provider_id }, function (err, entity) {
            if (err) {
                res.send(err);
            }
            res.json({
                message: "deleted"
            });
        });

    });

    apiRouter.route('/serviceprovider/appointmentDefinition/:provider_id/uploads/:content_id').delete(function (req, res) {
        KnowledgebaseContent.remove({ _id: req.params.content_id, serviceProviderId: req.params.provider_id }, function (err, entity) {
            if (err) {
                res.send(err);
            }
            res.json({
                message: "deleted"
            });
        });

    });

    apiRouter.route('/unApprovedSpList/').get(function (req, res) {
        // to complete
        SeriveProviders.find({ $or: [{ approved: 'pending' }, { approved: 'Rejected' }], isAdmin: false, __t: 'ServiceProviders', EmailVerified: true }, function (err, entity) {
            if (err) {
                res.send(err);
            }

            res.send(entity);
        });
    })

    apiRouter.route('/updateSpApprove/:provider_id/action/:action/:reason').put(function (req, res) {

        if (req.params.reason == 'undefined') {
            var set = {
                approved: req.params.action
            }
        } else {
            var set = {
                approved: "Rejected",
                reason: req.params.reason
            }
        }
        SeriveProviders.findOneAndUpdate({
            _id: req.params.provider_id
        }, {
                $set: set
            }, function (err, user) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }

                if (req.params.reason != 'undefined') {

                    message = 'Hello ' + user.firstName + ',<br>Sorry, Your Service provider request has been rejected due to following reasons, <br><b>' + req.params.reason + '</b>';
                    subject = 'Your Request has been rejected!'

                } else {
                    subject = 'Your Request has been approved!'
                    message = 'Hello ' + user.firstName + ',<br> <b>Your request has been approved!</b>';

                }

                client.transmissions.send({
                    transmissionBody: {
                        content: {
                            from: 'support@weresol.com',
                            subject: subject,
                            html: message
                        },
                        recipients: [
                            { address: user.userName }
                        ]
                    }
                },
                    function (err, res) {
                        if (err) {
                            console.log('oops something went wrong');
                        } else {
                            console.log('Success :Mail send');
                        }
                    });

                res.send({
                    message: 'Service provider updated!'
                });
            });

    });

    apiRouter.route('/serviceprovider/:provider_id')
        .get(function (req, res) {
            var ObjectId = require('mongoose').Types.ObjectId;

            SeriveProviders.findById(req.params.provider_id).lean().exec(function (err, entity) {
                if (err) {
                    res.send(err);
                }
                appointmentCollection.findById({ _id: entity.appointmentId }).lean().exec(function (err, appointment) {

                    if (err) {
                        //res.send(err);
                        console.log(err)
                    }
                    if (appointment) {
                        var currentDate = moment().format('YYYY-MM-DD');
                        var format = entity.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
                        entity.breakEndTime = utcToLocal(currentDate + ' ' + appointment.breakendTime, entity.timeZone, format).time;
                        entity.startTime = utcToLocal(currentDate + ' ' + appointment.startTime, entity.timeZone, format).time;
                        entity.endTime = utcToLocal(currentDate + ' ' + appointment.endTime, entity.timeZone, format).time;
                        entity.breakStartTime = utcToLocal(currentDate + ' ' + appointment.breakstartTime, entity.timeZone, format).time;
                        entity.effectiveFrom = appointment.effectiveFrom;
                        entity.averageAppoinmentTime = appointment.averageAppoinmentTime;
                        entity.appointmentId = entity.appointmentId;
                        entity.requirements = appointment.questions;
                    }

                    res.send(entity);

                });

            });
        }).put(function (req, res) {

            var securityAnswers = [{
                question: req.body.securityQuestion1,
                answer: req.body.answer1
            }, {
                question: req.body.securityQuestion2,
                answer: req.body.answer2
            }, {
                question: req.body.securityQuestion3,
                answer: req.body.answer3
            }];

            var currentDate = moment().format('YYYY-MM-DD');
            var format = req.body.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
            if (req.body.timeFormat == '12' && req.body.appointmentOption == 'Default') {
                var startTime = req.body.startTime + ' ' + req.body.startampm.toLowerCase();
                var endTime = req.body.endTime + ' ' + req.body.endampm.toLowerCase();
                var breakStartTime = req.body.breakStartTime + ' ' + req.body.breakstartampm.toLowerCase();
                var breakEndTime = req.body.breakEndTime + ' ' + req.body.breakendampm.toLowerCase();
                // console.log(req.decoded.timeZone)
                startTime = localToUtc(currentDate + ' ' + startTime, req.body.timeZone, format).time;
                endTime = localToUtc(currentDate + ' ' + endTime, req.body.timeZone, format).time;
                breakStartTime = localToUtc(currentDate + ' ' + breakStartTime, req.body.timeZone, format).time;
                breakEndTime = localToUtc(currentDate + ' ' + breakEndTime, req.body.timeZone, format).time;
                
                
            } else {
                startTime = localToUtc(currentDate + ' ' + req.body.startTime, req.body.timeZone, format).time;
                endTime = localToUtc(currentDate + ' ' + req.body.endTime, req.body.timeZone, format).time;
                breakStartTime = localToUtc(currentDate + ' ' + req.body.breakStartTime, req.body.timeZone, format).time;
                breakEndTime = localToUtc(currentDate + ' ' + req.body.breakEndTime, req.body.timeZone, format).time;
            }


            SeriveProviders.update({
                _id: req.params.provider_id
            }, {
                    $set: {
                        businessArea: req.body.businessArea,
                        businessCategory: req.body.businessCategory,
                        taxId: req.body.taxId,
                        addressLane1: req.body.addressLane1,
                        addressLane2: req.body.addressLane2,
                        city: req.body.city,
                        state: req.body.state,
                        zipCode: req.body.zipCode,
                        country: req.body.country,
                        securityQuestions: securityAnswers,
                        areaCode: req.body.areaCode,
                        email: req.body.newEmailAddress || req.body.email,
                        mobilePhone: req.body.mobilePhone,
                        contactPerson: req.body.contactPerson,
                        contactPhone: req.body.contactPhone,
                        timeZone: req.body.timeZone,
                        timeFormat: req.body.timeFormat,
                        appointmentOption: req.body.appointmentOption,
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }

                    if (req.body.appointmentOption == 'Default') {

                        appointmentCollection.find({ appointmentName: 'default_' + req.body.userName }, function (err, entity) {

                            if (!entity.length) {

                                SeriveProviders.findById({ _id: req.params.provider_id }, function (error, user) {

                                    var model = new appointmentCollection();
                                    model.appointmentName = 'default_' + req.body.userName;
                                    model.startTime = startTime;
                                    model.endTime = endTime;
                                    model.averageAppoinmentTime = req.body.averageAppoinmentTime;
                                    model.status = 'Active';
                                    model.effectiveFrom = req.body.effectiveFrom;
                                    model.breakstartTime = breakStartTime;
                                    model.breakendTime = breakEndTime;
                                    model.timeZone = req.body.timeZone;
                                    model.timeFormat = req.body.timeFormat;
                                    model.serviceProviderId = req.body._id;
                                    model.numberofEmployees = 1;
                                    model.effectiveTo = null;
                                    //model.employees.push(employee);
                                    model.appointmentId = user.uniqueId + '-' + 1;

                                    model.questions = req.body.appointmentQuestions;
                                    model.save(function (err, data) {
                                        if (err) {
                                            return res.send(err);
                                        } else {
                                            SeriveProviders.update({
                                                _id: req.params.provider_id
                                            }, {
                                                    $set: {
                                                        appointmentId: data._id
                                                    }
                                                }, function (err) {
                                                    console.log(data._id)
                                                    if (err) {
                                                        console.log(err);
                                                        res.send(err);
                                                    }
                                                });
                                        }
                                    });

                                })

                            } else {
                                appointmentCollection.update({
                                    appointmentName: 'default_' + req.body.userName
                                }, {
                                        $set: {
                                            startTime: startTime,
                                            endTime: endTime,
                                            effectiveFrom: req.body.effectiveFrom,
                                            effectiveTo: req.body.effectiveTo,
                                            breakstartTime: breakStartTime,
                                            breakendTime: breakEndTime,
                                            timeZone: req.body.timeZone,
                                            timeFormat: req.body.timeFormat,
                                            averageAppoinmentTime: req.body.averageAppoinmentTime,
                                            effectiveTo: null,
                                            questions: req.body.appointmentQuestions,
                                        }
                                    }, function (err) {
                                        if (err) {
                                            console.log(err);
                                            res.send(err);
                                        }
                                    });
                            }

                        });
                    } else {
                        appointmentCollection.find({ appointmentName: 'default_' + req.body.userName }, function (err, entity) {

                            if (entity.length) {
                                appointmentCollection.update({
                                    _id: req.body.appointmentId
                                }, {
                                        $set: {
                                            effectiveTo: moment().subtract(1, 'day').format('YYYY-MM-DD')
                                        }
                                    }, function (err) {
                                        if (err) {
                                            console.log(err);
                                            res.send(err);
                                        }
                                    });
                            }
                        });
                    }

                    console.log(req.body);



                    res.send({
                        message: 'Service provider updated!'
                    });
                });

        }).delete(function (res, req) {

            SeriveProviders.remove({
                _id: req.params.provider_id
            }, function (err, entity) {
                if (err) {
                    res.send(err);
                }

                res.json({
                    message: "Service provider has been deleted"
                });
            });
        });

    apiRouter.route('/serviceprovider/appointmentDefinition')
        .post(function (req, res) {

            if (req.body.timeFormat == '12') {
                format = 'hh:mm a';
            } else {
                format = 'HH:mm';
            }

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.startTime;         
            var startTimeutc = localToUtc(toDate, req.body.timeZone, format);
            var startDateutc = startTimeutc.date;  
            req.body.startTime = startTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(startTimeutc.date);
            var startDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveTo).format('YYYY-MM-DD') + ' ' + req.body.endTime;          
            var endTimeutc = localToUtc(toDate, req.body.timeZone, format);
            var endDateutc = endTimeutc.date;
            req.body.endTime = endTimeutc.time;
            var from = moment(req.body.effectiveTo);
            var to = moment(endTimeutc.date);
            var endDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.breakStartTime;
            var breakStartTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.breakStartTime = breakStartTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(breakStartTimeutc.date);
            var bsDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.breakEndTime;
            var breakEndTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.breakEndTime = breakEndTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(breakEndTimeutc.date);
            var beDayutcdiff = to.diff(from, 'days')



            console.log(req.body.startTime, req.body.endTime, req.body.breakStartTime, req.body.breakEndTime)

            var model = new appointmentCollection();
            model.appointmentName = req.body.appointmentName;
            model.appointmentId = req.body.appointmentID;
            model.appointmentType = req.body.appointmentType;
            model.appointmentCategory = req.body.appointmentCategory;
            model.appointmentSubCategory = req.body.appoinmentSubCategory;
            model.numberofEmployees = req.body.noOfEmployees;
            model.averageAppoinmentTime = req.body.averageAppTime;
            model.startTime = req.body.startTime;
            model.endTime = req.body.endTime;
            model.spot = req.body.spot;
            model.status = req.body.status;
            model.effectiveFrom = startDateutc;
            model.effectiveTo = endDateutc;
            model.breakstartTime = req.body.breakStartTime;
            model.breakendTime = req.body.breakEndTime;
            model.timeZone = req.body.timeZone;
            model.timeFormat = req.body.timeFormat;
            model.serviceProviderId = req.body.serviceProviderId;
            model.startTimeutcDayDiff = startDayutcdiff;
            model.endTimeutcDayDiff = endDayutcdiff;
            model.bstartTimeutcDayDiff = bsDayutcdiff;
            model.bendTimeutcDayDiff = beDayutcdiff;
            req.body.displayEmployee.forEach(function (item) {
                model.employees.push({
                    employeeID: item.employeeID,
                    employeeName: item.employeeName
                });
            })
            model.questions = req.body.questions;
            model.save(function (err) {
                if (err) {
                    return res.send(err);
                } else {
                    return res.json({
                        success: true,
                        message: "Appointment Created"
                    });
                }
            });
        })

    apiRouter.route('/serviceprovider/appointmentDefinitionCount/:id')
        .get(function (req, res) {
            appointmentCollection.find({ serviceProviderId: req.params.id }).count(function (err, count) {
                if (err) {
                    return res.send(err);
                }
                res.json(count);
            });
        });

    apiRouter.route('/serviceprovider/appointmentDefinition/:id')
        .get(function (req, res) {
            appointmentCollection.find({
                $or: [{
                    $or: [{ serviceProviderId: req.params.id }, { _id: req.params.id }]
                },
                {
                    employees: {
                        $elemMatch: {
                            employeeID: req.params.id
                        }
                    }
                }]
            }).lean().exec(function (err, appointments) {
                if (err) {
                    return res.send(err);
                }

                if (!appointments.length) return;

                var EmpId = _.pluck(appointments[0].employees, 'employeeID');
                userCollection.find({ _id: { $in: EmpId } }).select('__t firstName lastName').exec(function (error, customerEntity) {

                    if (error) {
                        return res.send(error);
                    }

                    _.each(appointments[0].employees, function (item) {
                        _.each(customerEntity, function (userItem) {
                            if (item.employeeID == userItem._id) {
                                item.employeeName = userItem.firstName + ' ' + userItem.lastName;
                            }
                        });
                    });

                    appointmentId = appointments[0].appointmentId;
                    serviceProviderId = appointments[0].serviceProviderId;


                    KnowledgebaseContent.find({ appointmentId: appointmentId, serviceProviderId: serviceProviderId }, function (error, contents) {

                        if (error) {
                            return res.send(error);
                        }
                        url = 'http://smartconnections.herokuapp.com/uploads/knowledgebase/';
                        var filteredContents = _.map(contents, function (model) {
                            return { _id: model._id, type: model.type, fileName: model.fileName, url: url + model.fileName }
                        });

                        appointments[0].knowledgeBase = filteredContents;

                        app = appointments[0];

                        if (app.timeFormat == '12') {
                            format = 'hh:mm a';
                        } else {
                            format = 'HH:mm';
                        }

                        toDate = moment(app.effectiveFrom).format('YYYY-MM-DD') + ' ' + app.startTime;
                        app.startTime = utcToLocal(toDate, app.timeZone, format).time;

                        toDate = moment(app.effectiveTo).format('YYYY-MM-DD') + ' ' + app.endTime;
                        app.endTime = utcToLocal(toDate, app.timeZone, format).time;

                        toDate = moment(app.effectiveFrom).format('YYYY-MM-DD') + ' ' + app.breakstartTime;
                        app.breakstartTime = utcToLocal(toDate, app.timeZone, format).time;

                        toDate = moment(app.effectiveTo).format('YYYY-MM-DD') + ' ' + app.breakendTime;
                        app.breakendTime = utcToLocal(toDate, app.timeZone, format).time;

                        //console.log(req.body.startTime,req.body.endTime,req.body.breakStartTime,req.body.breakEndTime )
                        console.log(app)
                        res.json(appointments);

                    })



                });


            });
        })
        .put(function (req, res) {

            if (req.body.timeFormat == '12') {
                format = 'hh:mm a';
            } else {
                format = 'HH:mm';
            }


           toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.startTime;
            var startTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.startTime = startTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(startTimeutc.date);
            var startDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.endTime;
            var endTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.endTime = endTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(endTimeutc.date);
            var endDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.breakStartTime;
            var breakStartTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.breakStartTime = breakStartTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(breakStartTimeutc.date);
            var bsDayutcdiff = to.diff(from, 'days')

            toDate = moment(req.body.effectiveFrom).format('YYYY-MM-DD') + ' ' + req.body.breakEndTime;
            var breakEndTimeutc = localToUtc(toDate, req.body.timeZone, format);
            req.body.breakEndTime = breakEndTimeutc.time;
            var from = moment(req.body.effectiveFrom);
            var to = moment(breakEndTimeutc.date);
            var beDayutcdiff = to.diff(from, 'days')

            console.log(req.body.startTime, req.body.endTime, req.body.breakStartTime, req.body.breakEndTime)

            appointmentCollection.update({
                _id: req.params.id
            }, {
                    $set: {
                        appointmentName: req.body.appointmentName,
                        appointmentId: req.body.appointmentID,
                        appointmentType: req.body.appointmentType,
                        appointmentCategory: req.body.appointmentCategory,
                        appointmentSubCategory: req.body.appoinmentSubCategory,
                        numberofEmployees: req.body.noOfEmployees,
                        averageAppoinmentTime: req.body.averageAppTime,
                        startTime: req.body.startTime,
                        endTime: req.body.endTime,
                        spot: req.body.spot,
                        status: req.body.status,
                        effectiveFrom: req.body.effectiveFrom,
                        effectiveTo: req.body.effectiveTo,
                        breakstartTime: req.body.breakStartTime,
                        breakendTime: req.body.breakEndTime,
                        timeZone: req.body.timeZone,
                        timeFormat: req.body.timeFormat,
                        serviceProviderId: req.body.serviceProviderId,
                        startTimeutcDayDiff : startDayutcdiff,
                        endTimeutcDayDiff : endDayutcdiff,
                        bstartTimeutcDayDiff : bsDayutcdiff,
                        bendTimeutcDayDiff : beDayutcdiff,
                        employees: [],
                        questions: req.body.questions
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    appointmentCollection.update({
                        _id: req.params.id
                    }, {
                            $pushAll: { employees: req.body.displayEmployee }
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                return res.send(err);
                            }
                        });
                    res.send({
                        success: true,
                        message: 'Appointment details updated!'
                    });
                });
        });

    apiRouter.route('/serviceprovider/appointmentDefinition/:id/:provider_id')
        .delete(function (req, res) {
            appointmentCollection.remove({
                _id: req.params.id,
                serviceProviderId: req.params.provider_id
            }, function (err) {
                if (err) {
                    return res.send(err)
                }
                res.send({ message: 'Appointment Deleted' })
            });
        });

    apiRouter.route('/gridViewPopulate/type/:type/value/:value')
        .get(function (req, res) {

            var db, success;
            var like = { '$regex': new RegExp('^' + req.params.value), '$options': 'i' }

            if (req.params.type == 'employee') {

                query = { $or: [{ firstName: like }, { lastName: like }], __t: 'Employees', serviceProviderId: req.decoded.id };
                db = userCollection;
            }

            if (req.params.type == "appointmentList") {
                query = { appointmentName: like, serviceProviderId: req.decoded.id };
                db = appointmentCollection;
            }

            if (req.params.type == "lookup") {
                query = { type: like, serviceProviderId: req.decoded.id };
                db = LookUpData;
            }

            db.find(query, function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                success = entity.length ? true : false
                res.json({ success: success, entity: entity });
            });

        })

    apiRouter.route('/serviceprovider/employee/:id').get(function (req, res) {

        userCollection.findById(req.params.id, function (err, emp) {

            userCollection.findById(emp.serviceProviderId).select('firstName lastName mobilePhone userName zipCode addressLane1 addressLane2 profilePicUrl city state').exec(function (err, sp) {
                res.send(sp);
            })
        })

    });

    apiRouter.route('/serviceprovider/serviceProviderRating/:rating/serviceProvider/:spId/')
        .get(function (req, res) {
            if (req.decoded.type != 'Customers') {
                return res.send({ success: false });
            }

            var spId = req.params.spId;

            var customerId = req.decoded.id;

            var rating = req.params.rating;

            ServiceProviderRating.find({ serviceProviderId: spId, customerId: customerId }, function (err, entity) {
                if (err) {
                    return res.send(err);
                }

                if (entity.length) {
                    ServiceProviderRating.update({
                        serviceProviderId: spId,
                        customerId: customerId
                    }, {
                            $set: {
                                rating: rating,
                            }
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                res.send(err);
                            }

                            res.send({ success: true });
                        });
                } else {
                    var model = new ServiceProviderRating();
                    model.serviceProviderId = spId;
                    model.customerId = customerId;
                    model.rating = rating;
                    model.save(function (err) {
                        if (err) {
                            return res.send(err);
                        } else {
                            return res.json({
                                success: true
                            });
                        }
                    });
                }

            })

        });





    function localToUtc(date, offset, format) {
        utc = moment(date, 'YYYY-MM-DD' + format).subtract(offset, 'minutes');
        return {
            date: utc.format('YYYY-MM-DD'),
            time: utc.format(format),
            full: utc.format('YYYY-MM-DD' +" "+ format)
        }
    }

    function utcToLocal(utc, offset, format) {
        local = moment(utc, 'YYYY-MM-DD' + format).add(offset, 'minutes');
        return {
            date: local.format('YYYY-MM-DD'),
            time: local.format(format),
            full: local.format('YYYY-MM-DD' +" "+ format)
        }
    }

    function PushNotification(customerid, messageData) {
        var serverKey = config.firbaseServerKey;
        var fcm = new FCM(serverKey);
        deviceCollection.findOne({ customerId: customerid }, function (err, device) {
            if (device.length >0) {
            _.each(device,function(item){
                var message = {
                    to: item.token,
                    //collapse_key: 'your_collapse_key',
                    priority: "normal",
                    data: {
                        Title: messageData.title,
                        Message : messageData.body
                    },
                    notification: {
                        "body": messageData.body,
                        "title": messageData.title,
                        "icon": "myicon",
                        "sound": "mySound"
                    }
                };

                //callback style
                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log(err);
                        return {
                            success: false,
                            message: err
                        }
                    } else {
                        console.log(response);
                        return {
                            success: true,
                            message: response
                        }
                    }
                });
                })    
            }
        });

    }

    return apiRouter;
};

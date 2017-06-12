var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var sparkpost = require('sparkpost');
var config = require('../../config');
var user = require('../models/user');
var Customers = require('../models/customer');
var appointmentShedule = require('../models/appointmentShedule');
var userCollection = mongoose.model('User', user);
var appointmentCollection = mongoose.model('appointmentShedule', appointmentShedule);
var appointment = require('../models/AppointmentDefinitions');
var KnowledgebaseContent = require('../models/knowledgebaseContent');
var appointmentDefinition = mongoose.model('Appointment', appointment);
var ServiceProviderRatings = require('../models/ServiceProviderRating');
var ServiceProviderRating = mongoose.model('ServiceProviderRating', ServiceProviderRatings);
var device = require('../models/deviceDetails');
var deviceCollection = mongoose.model('Device', device);

var moment = require('moment');
var _ = require('underscore');
var FCM = require('fcm-push');

var TOKEN_SECRET_STRING = config.secret;
var client = new sparkpost(config.sparkpostKey);
module.exports = function (app, express) {

    var customerApi = express.Router();

    customerApi.route('/')
        .post(function (req, res) {

            userCollection.findOne({ userName: new RegExp('^' + req.body.userName + '$', "i") }, function (err, entity) {
                if (entity) {
                    return res.json({
                        success: false,
                        message: 'A user with that username already exists. '
                    });
                } else {
                    var model = new Customers();
                    model.firstName = req.body.firstName;
                    model.lastName = req.body.lastName;
                    model.userName = req.body.userName;
                    model.password = req.body.password;
                    model.gender = req.body.gender;
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
                            // duplicate entry
                            // if (err.code == 11000)
                            //     return res.json({
                            //         success: false,
                            //         message: 'A user with that username already exists. '
                            //     });
                            // else
                            return res.send(err);
                        } else {
                            var id = room._id; console.log(req.body)
                            var link = "http://" + req.headers.host + "/verify/" + rand + "/" + id;
                            var html = 'Hello ' + req.body.firstName + ',<br><br> Please click on the link to verify your email.<br><a href="' + link + '">Click here to verify</a>'
                            var message = {
                                "subject": 'Please verify your Account',
                                "body": html
                            }
                            sendMail(req.body.userName, message)
                        }

                        res.json({
                            success: true,
                            message: 'Customer created!'
                        });
                    });
                }
            });
        })



    customerApi.post('/cancelAppointment/:id', function (req, res) {
        appointmentCollection.findOneAndUpdate({ _id: req.params.id }, {
            $set: {
                status: 'Cancelled',
            }
           
        }, function (err, entity) {
            if (err) {
                return res.send(err);
            }
             userCollection.findOne({_id:entity.serviceProviderID},function(error,user){
                 if (error) {
                     return res.send(error);
                 }
                  var format = user.timeFormat == 12 ? 'hh:mm a' : 'HH:mm';
                  var localappointmenttime = utcToLocal(entity.appointmentDate + ' '+ entity.appointmentTime,user.timeZone,format);
                  var message = 'Hi ' + user.firstName + ',<br><br> Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been Canceled.<br>'
                  var pushmessage = 'Hi ' + user.firstName + ', Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been Canceled.'
                  var message = {
                      "subject": 'Appointment Canceled',
                      "body": message
                  }
                  sendMail(user.userName, message);
                  var messageData = {
                      "body": pushmessage,
                      "title": "Appointment Canceled"
                  }
                  PushNotification(entity.customerID, messageData)
                  return res.send({ success: true });
             });         
        });
    })

    customerApi.use(function (req, res, next) {

        console.log('call reached the node server for customer api calls');

        var token = req.body.token || req.params.token || req.headers['x-access-token'];

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
    });

    customerApi.route('/:customer_id')
        .get(function (req, res) {
            Customers.findById(req.params.customer_id, function (err, entity) {
                if (err) {
                    return res.send(err);
                }

                res.send(entity);
            });
        })
        .put(function (req, res) {

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

            Customers.update({
                _id: req.params.customer_id
            }, {
                    $set: {
                        addressLane1: req.body.addressLane1,
                        addressLane2: req.body.addressLane2,
                        city: req.body.city,
                        email: req.body.email,
                        state: req.body.state,
                        zipCode: req.body.zipCode,
                        areaCode: req.body.areaCode,
                        securityQuestions: securityAnswers,
                        mobilePhone: req.body.newMobileNumber || req.body.mobilePhone,
                        areaOfInterest: req.body.areaOfInterest,
                        timeZone: req.body.timeZone,
                        timeFormat: req.body.timeFormat
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                        return res.send(err);
                    }

                    res.send({
                        message: 'Customer updated!'
                    });

                });

        });

    customerApi.route('/').get(function (req, res) {
        Customers.find(function (err, customers) {
            if (err) {
                res.send(err);
            }
            res.json(customers);
        });
    });

    customerApi.post('/scheduleAppointment', function (req, res) {

        var appointmentDate = req.body.appointmentDate;

        var anyEmp = req.body.anyEmp;
        var newEmpId;

        appointmentDefinition.findById(req.body.apointmentId, function (error, app) {

            console.log(req.body)
            console.log(req.decoded)


            userCollection.findById(req.body.customerID, function (err, customerUser) {

                if (req.decoded.type == 'Customers') {
                    customerTimezone = customerUser.timeZone;
                } else {
                    customerTimezone = app.timeZone
                }
                if (app.timeFormat == '12') {
                    format = 'hh:mm a';
                } else {
                    format = 'HH:mm';
                }

                toDate = req.body.appointmentDate + ' ' + req.body.appointmentTime;

                utcDateTime = localToUtc(toDate, customerTimezone, format);

                console.log(utcDateTime)

                var appointmentDate = utcDateTime.date;
                var appointmentTime = utcDateTime.time;
                            
                if(app.timeFormat == '12'){
                     var time24 = time12to24(req.body.appointmentTime);
                     var utc24time = localToUtc(req.body.appointmentDate+' '+time24, customerTimezone, 'HH:mm')
                     var appointmentTime24 = utc24time.time;
                     var appointmentDatetime24 = appointmentDate + ' ' + utc24time.time;
                }else{
                    var appointmentTime24 = appointmentTime;
                    var appointmentDatetime24 = appointmentDate + ' ' + appointmentTime;
                }

                console.log(utcDateTime)

                userCollection.findById(app.serviceProviderId, function (err, user) {
                    if (user.appointmentOption == 'Default') {
                        req.body.employeeId = app.serviceProviderId;
                    }

                    if (req.body.spot) {

                        if (app.timeFormat == '12') {
                            appTformat = 'hh:mma';
                        } else {
                            appTformat = 'HH:mm';
                        }

                        appSTime = moment(app.startTime, appTformat);
                        appETime = moment(app.endTime, appTformat);
                        appBSTime = moment(app.breakstartTime, appTformat);
                        appBETime = moment(app.breakendTime, appTformat);

                        var spotTime = moment(appointmentTime, appTformat);

                        valid = true;
                        if (!appSTime.isBefore(spotTime) || appETime.isBefore(spotTime)) {
                            valid = false;
                        }

                        if (appBSTime.isBefore(spotTime) && !appBETime.isBefore(spotTime)) {
                            valid = false;
                        }

                        if (!valid) {
                            // return res.send({
                            //         success: false,
                            //         message: 'Invalid Appointment Time'
                            //     }); 
                        }

                    }

                    if (req.body.updation) {
                        var extId = req.body.existingId;
                        appointmentCollection.findOneAndUpdate({
                            _id: extId
                        }, {
                                $set: {
                                    appointmentName: req.body.appointmentName,
                                    apointmentId: req.body.apointmentId,
                                    appointmentDate: appointmentDate,
                                    appointmentTime: appointmentTime,
                                    appointmentTime24 : appointmentTime24,
                                    appointmentDatetime24 : appointmentDatetime24,
                                    employeeId: req.body.employeeId,
                                    spot: req.body.spot,
                                    customerID: req.body.customerID,
                                    customerName: req.body.customerName,
                                    answers: req.body.answers
                                }
                            }, function (err,appointment) {
                                if (err) {
                                    console.log(err);
                                    return res.send(err);
                                }

                                if(req.body.type == "Service_Provider"){
                                var html = '<b>Your Appointment Details Updated</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled Date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' + req.body.appointmentTime + '<br/><br/> Confirmation number :' + req.body.appRefNo //+ '<br/><br/> Sequence number : ' + model.sequenceNumber

                                var pushmessage = 'Your Appointment Details Updated Customer Name: ' + req.body.customerName + ' Appointment scheduled Date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' + req.body.appointmentTime + ' Confirmation number :' + req.body.appRefNo //+ '<br/><br/> Sequence number : ' + model.sequenceNumber
                                var message = {
                                    "subject": 'Appointment Update',
                                    "body": html
                                }
                                sendMail(req.body.spEmail, message);

                                var messageData = {
                                    "body": pushmessage,
                                    "title": "Appointment Updated"
                                }
                                PushNotification(req.body.customerID, messageData)
                                }else{
                                    var html = '<b>Your Appointment Schedule Updated</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled Date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' + req.body.appointmentTime + '<br/><br/> Confirmation number :' + appointment.appRefNo //+ '<br/><br/> Sequence number : ' + model.sequenceNumber

                                var pushmessage = 'Your Appointment Schedule Updated Customer Name: ' + req.body.customerName + ' Appointment scheduled Date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' + req.body.appointmentTime + ' Confirmation number :' + appointment.appRefNo //+ '<br/><br/> Sequence number : ' + model.sequenceNumber
                                var message = {
                                    "subject": 'Appointment Schedule Updated',
                                    "body": html
                                }
                                sendMail(user.userName, message);

                                var messageData = {
                                    "body": pushmessage,
                                    "title": "Appointment Schedule Updated"
                                }
                                PushNotification(app.serviceProviderId, messageData)
                                }
                                res.send({
                                    success: true,
                                    message: 'Appointment details updated!'
                                });
                            });

                    } else {
                        var flag;
                        appointmentCollection.find({ appointmentDate: appointmentDate, apointmentId: req.body.apointmentId, appointmentTime: appointmentTime, employeeId: req.body.employeeId, spot: req.body.spot, status: { $ne: "Cancelled" } }, function (err, entity) {
                            if (err) {
                                return res.send(err);
                            }

                            if (req.body.noOfEmployees) {
                                if (!req.body.spot) {
                                    flag = entity.length >= req.body.noOfEmployees ? true : false;
                                } else {
                                    flag = entity.length ? true : false;
                                }
                            } else {
                                flag = entity.length ? true : false;
                            }

                            if (flag) {
                                return res.json({
                                    success: false,
                                    message: "Appointment Time is already taken"
                                });
                            } else {
                                var model = new appointmentCollection();
                                model.customerID = req.body.customerID;
                                model.customerName = req.body.customerName;
                                model.appointmentDate = appointmentDate;
                                model.spot = req.body.spot;
                                model.answers = req.body.answers;
                                model.appointmentTime = appointmentTime;
                                model.appointmentTime24 = appointmentTime24;
                                model.appointmentDatetime24 = appointmentDatetime24;
                                model.apointmentId = req.body.apointmentId;
                                model.appointmentName = req.body.appointmentName;
                                model.employeeId = req.body.employeeId;
                                model.serviceProviderID = req.body.serviceProviderId;

                                var dateobj = new Date();
                                var month = dateobj.getMonth() + 1;
                                var day = dateobj.getDate();
                                var year = dateobj.getFullYear();
                                var hour = dateobj.getHours();
                                var minute = dateobj.getMinutes();
                                var datatime = day + '' + month + '' + year + '' + hour + '' + minute;

                                spAddress = 'Name: ' + user.firstName + ' ' + user.lastName + '<br/><br/>';

                                if(user.city!=null) { spAddress + user.city + ', '};
                                if(user.state!=null){spAddress + user.state + ', '};
                                spAddress = spAddress + user.zipCode + ', ' + user.country;

                                appointmentCollection.count({ appointmentDate: appointmentDate, spot: req.body.spot }, function (err, count) {

                                    if (req.body.spot) {
                                        model.sequenceNumber = "SPOT-" + count;
                                        model.status = "Confirmed";
                                    } else {
                                        model.sequenceNumber = count;
                                        if (req.body.type == "Service_Provider") {
                                            model.status = "Confirmed";
                                        }
                                    }

                                    if (user.appointmentOption == 'Regular') {
                                        model.status = 'Confirmed';
                                    }

                                    model.appRefNo = req.body.spuniqueId + '' + datatime + '' + req.body.displayappointmentId + '' + model.sequenceNumber;


                                    if (anyEmp) {
                                        appointmentCollection.find({ appointmentDate: appointmentDate, apointmentId: req.body.apointmentId, appointmentTime: appointmentTime }).select('employeeId').exec(function (err, scheduleCollection) {

                                            appointmentDefinition.findById(req.body.apointmentId).exec(function (error, definition) {
                                                employeeCollection = definition.employees;
                                                for (i = 0; i < employeeCollection.length; i++) {
                                                    flag = true;
                                                    scheduleCollection.forEach(function (scheduleItem) {
                                                        if (scheduleItem.employeeId == employeeCollection[i].employeeID) {

                                                            flag = false;
                                                        }
                                                    })

                                                    if (flag) {
                                                        newEmpId = employeeCollection[i].employeeID;
                                                        break;
                                                    }
                                                }
                                                model.employeeId = newEmpId;
                                                model.save(function (err) {
                                                    if (err) {
                                                        return res.send(err);
                                                    } else {

                                                        var qustionsAnswers = '';
                                                        for (i = 0; i < req.body.answers.length; i++) {
                                                            qustionsAnswers = qustionsAnswers + 'Question: ' + req.body.answers[i].question + '<br /> Answer: ' + req.body.answers[i].answer + '<br/><br/>';
                                                        }

                                                        if (req.body.type == "Service_Provider") {

                                                            var html = '<b>You have a new appointment</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled Date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' + req.body.appointmentTime + '<br/><br/> Confirmation number :' + model.appRefNo + '<br/><br/> Sequence number : ' + model.sequenceNumber
                                                            var pushmessage = 'You have a new appointment Customer Name: ' + req.body.customerName + ' Appointment scheduled date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' + req.body.appointmentTime + ' Confirmation number :' + model.appRefNo + ' Sequence number : ' + model.sequenceNumber
                                                            if (req.body.spot) {
                                                                html = html + '<br/><br/> Sequence Number : ' + model.sequenceNumber
                                                            }
                                                            html = html + '<br/><br/>ServiceProvider Details <br/>' + spAddress;
                                                            var message = {
                                                                "subject": 'New Appointment Schedule',
                                                                "body": html
                                                            }
                                                            sendMail(req.body.spEmail, message);
                                                            var messageData = {
                                                                "body": pushmessage,
                                                                "title": "Appointment Created"
                                                            }
                                                            PushNotification(req.body.customerID, messageData)
                                                        } else {
                                                            var html = '<b>You have a new appointment</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' + req.body.appointmentTime + '<br/><br/> Confirmation number :' + model.appRefNo + '<br/><br/> Sequence number : ' + model.sequenceNumber
                                                            var pushmessage = 'You have a new appointment Customer Name: ' + req.body.customerName + ' Appointment scheduled date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' + req.body.appointmentTime + ' Confirmation number :' + model.appRefNo + ' Sequence number : ' + model.sequenceNumber
                                                            if (req.body.spot) {
                                                                html = html + '<br/><br/> Sequence Number : ' + model.sequenceNumber
                                                            }

                                                            html = html + '<br/><br/>ServiceProvider Details <br/>' + spAddress;
                                                            var message = {
                                                                'subject': 'New Appointment Schedule',
                                                                'body': html
                                                            }
                                                            sendMail(user.userName, message)
                                                            var messageData = {
                                                                "body": pushmessage,
                                                                "title": "Appointment Scheduled"
                                                            }
                                                            PushNotification(app.serviceProviderId, messageData)
                                                            // console.log("Test" + app.serviceProviderId);
                                                            // console.log("Test" + user.userName);
                                                        }
                                                        return res.json({
                                                            success: true,
                                                            message: "Appointment Created",
                                                            sequenceNumber: model.sequenceNumber,
                                                            confirmationNumber: model.appRefNo
                                                        });
                                                    }
                                                });

                                            });
                                        });
                                    } else {
                                        model.save(function (err) {
                                            if (err) {
                                                return res.send(err);
                                            } else {
                                                var qustionsAnswers = '';
                                                for (i = 0; i < req.body.answers.length; i++) {
                                                    qustionsAnswers = qustionsAnswers + 'Question: ' + req.body.answers[i].question + '<br /> Answer: ' + req.body.answers[i].answer + '<br/><br/>';
                                                }

                                                if (req.body.type == "Service_Provider") {
                                                    var html = '<b>You have a new appointment</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' +  req.body.appointmentTime  + '<br/><br/> Confirmation number :' + model.appRefNo + '<br/><br/> Sequence number : ' + model.sequenceNumber
                                                    var pushmessage = 'You have a new appointment Customer Name: ' + req.body.customerName + ' Appointment scheduled date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' +  req.body.appointmentTime  + ' Confirmation number :' + model.appRefNo + ' Sequence number : ' + model.sequenceNumber
                                                    if (req.body.spot) {
                                                        html = html + '<br/><br/> Sequence Number : ' + model.sequenceNumber
                                                    }

                                                    html = html + '<br/><br/>ServiceProvider Details <br/>' + spAddress;
                                                    var message = {
                                                        'subject': 'New Appointment Schedule',
                                                        'body': html
                                                    }
                                                    sendMail(req.body.spEmail, message)
                                                    var messageData = {
                                                        "body": pushmessage,
                                                        "title": "Appointment Created"
                                                    }
                                                    PushNotification(req.body.customerID, messageData)
                                                }else{
                                                      var html = '<b>You have a new appointment</b> <br /><hr /><br/>Customer Name: ' + req.body.customerName + '<br/><br/> Appointment scheduled date: ' + req.body.appointmentDate + '<br/><br/> Appointment scheduled Time: ' +  req.body.appointmentTime  + '<br/><br/> Confirmation number :' + model.appRefNo + '<br/><br/> Sequence number : ' + model.sequenceNumber
                                                    var pushmessage = 'You have a new appointment Customer Name: ' + req.body.customerName + ' Appointment scheduled date: ' + req.body.appointmentDate + ' Appointment scheduled Time: ' +  req.body.appointmentTime  + ' Confirmation number :' + model.appRefNo + ' Sequence number : ' + model.sequenceNumber
                                                    if (req.body.spot) {
                                                        html = html + '<br/><br/> Sequence Number : ' + model.sequenceNumber
                                                    }

                                                    html = html + '<br/><br/>ServiceProvider Details <br/>' + spAddress;
                                                    var message = {
                                                        'subject': 'New Appointment Schedule',
                                                        'body': html
                                                    }
                                                    sendMail(user.userName, message)
                                                    var messageData = {
                                                        "body": pushmessage,
                                                        "title": "Appointment Scheduled"
                                                    }
                                                    PushNotification(app.serviceProviderId, messageData)
                                                    // console.log("Test" + app.serviceProviderId);
                                                    // console.log("Test" + user.userName);
                                                }
                                                return res.json({
                                                    success: true,
                                                    message: "Appointment Created",
                                                    sequenceNumber: model.sequenceNumber,
                                                    confirmationNumber: model.appRefNo
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }

                })
            });


        })


    })

        .get('/scheduleAppointment/:spId', function (req, res) {

            var currentdate = moment().format('YYYY-MM-DD');
            console.log(currentdate)
            appointmentCollection.find({ status: 'pending', serviceProviderID: req.params.spId ,appointmentDate: {$gte: currentdate}}).lean().exec(function (err, entity) {
                if (err) {
                    return res.send(err);
                }

                if (!entity.length) 
                {
                     return res.send(entity);
                };

                var appIds = _.uniq(_.pluck(entity, 'apointmentId'));

                appointmentDefinition.find({ '_id': { $in: appIds } }).exec(function (error, definition) {
                    if (error) {
                        return res.send(error);
                    }

                    _.each(entity, function (item) {
                        _.each(definition, function (definition) {
                            timezone = definition.timeZone;
                            if (definition.timeFormat == '12') {
                                format = 'hh:mm a';
                            } else {
                                format = 'HH:mm';
                            }
                            if (item.apointmentId == definition._id) {
                                dateTime = item.appointmentDate + ' ' + item.appointmentTime;
                                localTime = utcToLocal(dateTime, timezone, format);
                                item.appointmentDate = localTime.date;
                                item.appointmentTime = localTime.time;
                                item.appointmentName = definition.appointmentName;
                            }
                        });


                    });
                    res.send(entity);
                    console.log("===========Success=======")
                });


            });
        })

        .get('/scheduleAppointment/shedules/:date/id/:id/empId/:empId/', function (req, res) {

            appointmentCollection.find({ appointmentDate: req.params.date, apointmentId: req.params.id, employeeId: req.params.empId, spot: false }, function (err, entity) {
                if (err) {
                    return res.send(err);
                }

                res.send(entity);
            });
        })
        .get('/scheduleAppointment/refNo/:no/spId/:spId', function (req, res) {

            appointmentCollection.findOne({
                appRefNo: req.params.no,
                $or: [{ serviceProviderID: req.params.spId }, { customerID: req.params.spId }],
                status: { $ne: "Cancelled" }
            }, function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                res.send(entity);
            });
        })
        .get('/scheduleAppointment/last/empId/:empId/apId/:apId/:currentdate', function (req, res) {

            //     var date = new Date();
            //     var todate = new Date();
            //     todate.setDate(todate.getDate()+1);
            //    // date.setHours(0, 0, 0, 0);
            //    // var now_utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
            //     date = date.toISOString();
            //     todate = todate.toISOString();
            //     date = date.substring(0, date.indexOf('T'));
            //     todate = todate.substring(0, todate.indexOf('T'));
            //     date = date + "T00:00:00.000Z";
            //     todate = todate + "T00:00:00.000Z";

            appointmentCollection.findOne({ employeeId: req.params.empId, appointmentDate: req.params.currentdate, apointmentId: req.params.apId, spot: true }).sort([['_id', -1]]).limit(1).select('appointmentTime  appointmentDate customerName').exec(function (e, data) {
                //handle result
                if (e) {
                    return res.send(e);
                }
                
                appointmentDefinition.findOne({ _id : req.params.apId}).exec(function(err,appointment){
                    if (err) {
                        return res.send(err);
                    }
                    if (appointment.timeFormat == '12') {
                        format = 'hh:mm a';
                    } else {
                        format = 'HH:mm';
                    }
                    if(data!=null){
                        dateTime = data.appointmentDate + ' ' + data.appointmentTime;
                        localTime = utcToLocal(dateTime, appointment.timeZone, format);
                        data.appointmentTime = localTime.time;
                        data.appointmentDate = localTime.date;
                        data._doc.appointmentEndTime = utcToLocal(moment().format('YYYY-MM-DD') + ' ' + appointment.endTime, appointment.timeZone, format).time;
                        res.send(data);
                    }else{
                        dateTime = moment().format('YYYY-MM-DD') + ' ' + appointment.startTime;
                        localTime = utcToLocal(dateTime, appointment.timeZone, format);
                        EndTime = utcToLocal(moment().format('YYYY-MM-DD') + ' ' + appointment.endTime, appointment.timeZone, format).time;
                        data = {
                            appointmentTime : localTime.time,
                            appointmentDate : localTime.date,
                            appointmentEndTime : EndTime
                        }
                       
                        res.send(data)
                    }
                   
                });
                
               
            });
        })
        .get('/scheduleAppointment/slots/:date/id/:apId/emp/:empId/view/:view/customer/:customerId', function (req, res) {

            date = moment(req.params.date);

            userCollection.findById(req.params.customerId, function (err, customerUser) {

                if (req.params.view == 'day') {
                    startDate = date.format('YYYY-MM-DD');
                    endDate = moment(startDate, "YYYY-MM-DD").add(2, 'days').format('YYYY-MM-DD');
                } else {
                    weekStartDate = moment(date).startOf('week');
                    weekEndDate = moment(date).endOf('week');

                    startDate = weekStartDate.format('YYYY-MM-DD');
                    endDate = weekEndDate.format('YYYY-MM-DD');

                    //var start24 = localToUtc(startDate +' '+ "00:00",)
                }
                var find = {
                    appointmentDate: { $lte: endDate, $gte: startDate },
                    spot: false,
                    status: { $ne: "Cancelled" },
                    apointmentId : req.params.apId
                };

                // if (req.params.empId == 'undefined' || req.params.empId == 'null') {
                //     find.apointmentId = req.params.apId;
                // }

                appointmentCollection.find(find, { $or: [{ employeeId: req.params.empId }, { employeeId: null }] }).select('appointmentTime appointmentDate employeeId  appointmentDatetime24 appointmentTime24').lean().exec(function (err, entity) {

                    if (err) {
                        return res.send(err);
                    }

                    appointmentDefinition.findById(req.params.apId).lean().exec(function (error, definition) {

                        if (error) {
                            return res.send(error);
                        }

                        if (!definition) return;

                        eTDate = moment(definition.effectiveTo).subtract(definition.endTimeutcDayDiff, "days");
                        eFDate = moment(definition.effectiveFrom).subtract(definition.startTimeutcDayDiff, "days");

                        var dateArray = [];
                        var dateAppointments = {};
                        var currentDate = moment(startDate);

                        appointmentDates = [];
                        validDates = [];

                        var currentUtcDate = moment.utc().format('YYYY-MM-DD ' + 'HH:mm');
                        var currentlocaldate  = utcToLocal(currentUtcDate,definition.timeZone, 'HH:mm');
                        while (currentDate <= moment(endDate)) {
                            flag = true;

                            if (definition.effectiveTo) {
                                console.log(moment(moment().format('YYYY-MM-DD')));
                                console.log(moment(currentDate.format('YYYY-MM-DD')));
                                if (moment(currentDate).isBetween(eFDate, eTDate, null, '[]') &&  moment(currentDate) >= moment(currentlocaldate.date)) {


                                    validDates.push(currentDate.format('YYYY-MM-DD'));
                                    var currentDateStart = localToUtc(currentDate.format('YYYY-MM-DD 00:00'),definition.timeZone,'HH:mm');
                                    var currentDateEnd = localToUtc(currentDate.format('YYYY-MM-DD 23:59'),definition.timeZone,'HH:mm');
                                    var Slotes = _.filter(entity,function(item){                                  
                                       return item.appointmentDatetime24 > currentDateStart.full && item.appointmentDatetime24 < currentDateEnd.full;
                                    })
                                    // if (_.where(entity, { "appointmentDatetime24" : currentDate.format('YYYY-MM-DD') }).length) {
                                    //     flag = false;
                                    //     appointmentDates = appointmentDates.concat(_.filter(entity, { appointmentDate: currentDate.format('YYYY-MM-DD') }));
                                    // }
                                     if (Slotes.length) {
                                        flag = false;
                                        appointmentDates = appointmentDates.concat(Slotes);
                                    }
                                }

                                else if(moment(currentDate.format('YYYY-MM-DD')).isSame(moment(currentlocaldate.date))){
                                    validDates.push(currentDate.format('YYYY-MM-DD'));
                                    var currentDateStart = localToUtc(currentDate.format('YYYY-MM-DD 00:00'),definition.timeZone,'HH:mm');
                                    var currentDateEnd = localToUtc(currentDate.format('YYYY-MM-DD 23:59'),definition.timeZone,'HH:mm');
                                    var Slotes = _.filter(entity, function (item) {
                                        return item.appointmentDatetime24 > currentDateStart.full && item.appointmentDatetime24 < currentDateEnd.full;
                                    })
                                    // if (_.where(entity, { "appointmentDate": currentDate.format('YYYY-MM-DD') }).length) {
                                    //     flag = false;
                                    //     appointmentDates = appointmentDates.concat(_.filter(entity, { appointmentDate: currentDate.format('YYYY-MM-DD') }));
                                    // }
                                     if (Slotes.length) {
                                        flag = false;
                                        appointmentDates = appointmentDates.concat(Slotes);
                                    }
                                }
                            } else {
                                if (moment(currentDate) >= moment(currentlocaldate.date)) {

                                    validDates.push(currentDate.format('YYYY-MM-DD'));

                                    var currentDateStart = localToUtc(currentDate.format('YYYY-MM-DD 00:00'),definition.timeZone,'HH:mm');
                                    var currentDateEnd = localToUtc(currentDate.format('YYYY-MM-DD 23:59'),definition.timeZone,'HH:mm');
                                    var Slotes = _.filter(entity, function (item) {
                                        return item.appointmentDatetime24 > currentDateStart.full && item.appointmentDatetime24 < currentDateEnd.full;
                                    })
                                    // if (_.where(entity, { "appointmentDate": currentDate.format('YYYY-MM-DD') }).length) {
                                    //     flag = false;
                                    //     appointmentDates = appointmentDates.concat(_.filter(entity, { appointmentDate: currentDate.format('YYYY-MM-DD') }));
                                    // }
                                     if (Slotes.length) {
                                        flag = false;
                                        appointmentDates = appointmentDates.concat(Slotes);
                                    }
                                }
                            }

                            if (flag) appointmentDates.push({ "appointmentDate": currentDate.format('YYYY-MM-DD') });

                            currentDate = moment(currentDate).add(1, 'days');
                        }

                        // appointments = _.chain(appointmentDates).groupBy('appointmentDate').map(function (value, key) {

                        //     flag = false;
                        //     if (_.contains(validDates, value[0].appointmentDate)) {
                        //         flag = true;
                        //     }

                        //     items = flag ? value : [];
                        //     return {
                        //         date: key,
                        //         items: items,
                        //         valid: flag
                        //     }
                        // }).value();

                        if (definition.timeFormat == '12') {
                            format = 'hh:mm a';
                        } else {
                            format = 'HH:mm';
                        }

                            _.each(appointmentDates,function(item){
                                if(item.appointmentTime){
                                    var localappointmenttime = utcToLocal(item.appointmentDate+ ' ' + item.appointmentTime,definition.timeZone,format);
                                    var localappointmenttime24 = utcToLocal(item.appointmentDatetime24,definition.timeZone,'HH:mm');
                                    item.appointmentDate = localappointmenttime.date;
                                    item.appointmentTime = localappointmenttime.time;
                                    item.appointmentDatetime24 = localappointmenttime24.full;
                                    item.appointmentTime24 = localappointmenttime24.time;
                                }
                            });

                          appointments = _.chain(appointmentDates).groupBy('appointmentDate').map(function (value, key) {

                            flag = false;
                            if (_.contains(validDates, value[0].appointmentDate)) {
                                flag = true;
                            }

                            items = flag ? value : [];
                            return {
                                date: key,
                                items: items,
                                valid: flag
                            }
                        }).value();

                        //// calculate slotes
                        var pm = [], am = [], appointmetTimeArray = [];

                        var startTime = utcToLocal(moment(definition.effectiveFrom).format('YYYY-MM-DD')+ ' ' + definition.startTime,definition.timeZone,format).time  ;
                        var endTime = utcToLocal(moment(definition.effectiveFrom).format('YYYY-MM-DD')+ ' ' + definition.endTime,definition.timeZone,format).time ;

                        var bSTime = utcToLocal(moment(definition.effectiveFrom).format('YYYY-MM-DD')+ ' ' + definition.breakstartTime,definition.timeZone,format).time ; 
                        var bETime = utcToLocal(moment(definition.effectiveFrom).format('YYYY-MM-DD')+ ' ' + definition.breakendTime,definition.timeZone,format).time  ;
                        if (req.decoded.type == 'ServiceProviders') {
                            customTimezone = definition.timeZone;
                        } else {
                            customTimezone = customerUser.timeZone;
                        }

                        var fromLeft = 5, format;
                       
                        console.log(startTime, endTime, bSTime, bETime)
                        console.log('--------' + customTimezone)
                        appBreakTimeS = bSTime;
                        appBreakTimeE = bETime;

                        sTime = startTime
                        eTime = bSTime

                        secondSTime = bETime
                        secondETime = endTime

                        // sTime = sTime + ' ' + startTime.substring(6);
                        // eTime = eTime + ' ' + bSTime.substring(6);

                        // secondSTime = secondSTime + ' ' + bETime.substring(6);
                        // secondETime = secondETime + ' ' + endTime.substring(6);

                        // t1 = moment(sTime, format).add('days',definition.startTimeutcDayDiff);
                        // t2 = moment(eTime, format).add('days',definition.bstartTimeutcDayDiff);
                        // t3 = moment(secondSTime, format).add('days',definition.bendTimeutcDayDiff);
                        // t4 = moment(secondETime, format).add('days',definition.endTimeutcDayDiff);
                        t1 = moment(startTime, format)
                        t2 = moment(bSTime, format)
                        t3 = moment(bETime, format)
                        t4 = moment(endTime, format)
                        console.log(sTime, eTime, secondSTime, secondETime)

                        var avgTime = definition.averageAppoinmentTime;

                        timeSlotAm = Math.abs(t2.diff(t1, 'minutes') / definition.averageAppoinmentTime);
                        timeSlotPm = Math.abs(t3.diff(t4, 'minutes') / definition.averageAppoinmentTime);

                        console.log('-------------------')
                        console.log(timeSlotPm)

                        var fPreTime, sPreTime;
                        fPreTimeAp = sTime;
                        sPreTimeAp = secondSTime;

                        var xAxisTimeAm = [], xAxisTimePm = [], xAxisTimeSlote;
                        var i = 0;
                        while (i < timeSlotAm) {

                            fPreTime = t1.add(avgTime, 'minutes').format(format);
                            xAxisTimeAm.push(fPreTimeAp);

                            fPreTimeAp = fPreTime;
                            i++;
                        };

                        i = 0;
                        while (i < timeSlotPm) {

                            sPreTime = t3.add(avgTime, 'minutes').format(format);
                            xAxisTimePm.push(sPreTimeAp);
                            sPreTimeAp = sPreTime;
                            i++;
                        }
                        xAxisTimeSlote = {
                            am: xAxisTimeAm,
                            pm: xAxisTimePm
                        }
                        console.log(xAxisTimeSlote)
                        xAxisTimeSlote = xAxisTimeAm.concat(bSTime);
                        xAxisTimeSlote = xAxisTimeSlote.concat(xAxisTimePm)


                        var weekDates = appointments, weekView = [];
                        var appointmentSlotes = [];

                        for (j = 0; j < weekDates.length; j++) {
                            dayItem = weekDates[j];

                            dayItem.date = {
                                itemDate: dayItem.date,
                                date: moment(dayItem.date).format("DD"),
                                day: moment(dayItem.date).format("ddd"),
                            }
                            var slotes = [];


                            for (i = 0; i < dayItem.items.length; i++) {

                                t1 = moment(sTime, format);
                                t2 = moment(eTime, format);
                                t3 = moment(secondSTime, format);
                                t4 = moment(secondETime, format);

                                am = [], pm = [];
                                fPreTimeAp = sTime;

                                var k = 0;

                                if (weekDates[j].valid) {

                                    while (k < timeSlotAm) {
                                        fPreTime = t1.add(avgTime, 'minutes').format(format);

                                        appCatTime1 = fPreTimeAp;

                                        flag = true, appointmetTimeArray = [];
                                        dayItem.items.forEach(function (item) {
                                            count = 0;
                                            if (req.params.empId == 'undefined' || req.params.empId == 'null') {

                                                if (item.appointmentTime) {
                                                    appointmentSpecificTime = item.appointmentDate + item.appointmentTime;
                                                    appointmetTimeArray.push(appointmentSpecificTime);

                                                    appointmetTimeArray.forEach(function (dateTime) {
                                                        time = item.appointmentDate + appCatTime1;
                                                        if (dateTime == time) {
                                                            count++;
                                                        }
                                                    });

                                                    if (count >= parseInt(definition.numberofEmployees))
                                                        flag = false;
                                                }
                                            } else {

                                                if (item.appointmentTime == appCatTime1) {

                                                    if (item.employeeId == req.params.empId) {
                                                        flag = false;
                                                    } else {
                                                        appointmentSpecificTime = item.appointmentDate + item.appointmentTime;
                                                        appointmetTimeArray.push(appointmentSpecificTime);

                                                        appointmetTimeArray.forEach(function (dateTime) {
                                                            time = item.appointmentDate + appCatTime1;
                                                            if (dateTime == time) {
                                                                count++;
                                                            }
                                                        });

                                                        if (count >= parseInt(definition.numberofEmployees))
                                                            flag = false;
                                                    }
                                                }
                                            }

                                        });

                                        am.push({
                                            'time': fPreTimeAp,
                                            'available': flag
                                        });

                                        fPreTimeAp = fPreTime;
                                        k++;
                                    };

                                    k = 0;
                                    sPreTimeAp = secondSTime;
                                    while (k < timeSlotPm) {

                                        sPreTime = t3.add(avgTime, 'minutes').format(format);
                                        appCatTime2 = sPreTimeAp;

                                        flag = true, appointmetTimeArray = [];
                                        dayItem.items.forEach(function (item) {
                                            count = 0;
                                            if (req.params.empId == 'undefined' || req.params.empId == 'null') {

                                                if (item.appointmentTime) {
                                                    appointmentSpecificTime = item.appointmentDate + item.appointmentTime;
                                                    appointmetTimeArray.push(appointmentSpecificTime);

                                                    appointmetTimeArray.forEach(function (dateTime) {
                                                        time = item.appointmentDate + appCatTime2;
                                                        if (dateTime == time) {
                                                            count++;
                                                        }
                                                    });

                                                    if (count >= parseInt(definition.numberofEmployees))
                                                        flag = false;
                                                }
                                            } else {
                                                if (item.appointmentTime == appCatTime2) {
                                                    if (item.employeeId == req.params.empId) {
                                                        flag = false;
                                                    } else {
                                                        appointmentSpecificTime = item.appointmentDate + item.appointmentTime;
                                                        appointmetTimeArray.push(appointmentSpecificTime);

                                                        appointmetTimeArray.forEach(function (dateTime) {
                                                            time = item.appointmentDate + appCatTime2;
                                                            if (dateTime == time) {
                                                                count++;
                                                            }
                                                        });

                                                        if (count >= parseInt(definition.numberofEmployees))
                                                            flag = false;
                                                    }
                                                }
                                            }
                                        });
                                        pm.push({
                                            'time': sPreTimeAp,
                                            'available': flag
                                        });
                                        sPreTimeAp = sPreTime;

                                        k++;
                                    }

                                    slotes = am.concat({ time: bSTime, available: false, type: 'break' });
                                    slotes = slotes.concat(pm)
                                }
                            }

                            weekView.push({
                                day: dayItem.date,
                                slots: slotes,
                                valid: dayItem.valid
                            });
                        }

                        appointmentSlotes = weekView;
                        var currentDate = moment().utc().format('YYYY-MM-DD');
                        var currentTime = utcToLocal(currentDate + ' ' + moment.utc().format(format), customTimezone, format).time;
                        currentDate = utcToLocal(currentDate + ' ' + moment.utc().format(format), customTimezone, format).date;
                        console.log(currentDate );
                        for (i = 0; i < appointmentSlotes.length; i++) {
                            for (j = 0; j < appointmentSlotes[i].slots.length; j++) {
                                // toDate = appointmentSlotes[i].day.itemDate + ' ' + appointmentSlotes[i].slots[j].time;
                                // appointmentSlotes[i].slots[j].time = utcToLocal(toDate, customTimezone
                                //     , format).time;
                                if (appointmentSlotes[i].day.itemDate == currentDate) {
                                    var beginTime = moment(appointmentSlotes[i].slots[j].time, format);
                                    var endTime = moment(currentTime, format);
                                    console.log(beginTime);
                                    console.log(endTime);
                                    if (beginTime.isBefore(endTime)) {
                                        appointmentSlotes[i].slots[j].late = true;
                                    }
                                }
                            }
                        }
                        //console.log('-------------')
                        // for (i = 0; i < xAxisTimeSlote.length; i++) {
                        //     toDate = appointmentSlotes[0].day.itemDate + ' ' + xAxisTimeSlote[i];

                        //     xAxisTimeSlote[i] = utcToLocal(toDate, customTimezone, format).time;
                        // }

                        if (req.params.view == 'day')
                            res.send(appointmentSlotes);
                        else
                            res.send({ xAxisTime: xAxisTimeSlote, appointmentSlots: appointmentSlotes });

                    })
                });

            });
        })


        .get('/scheduleAppointment/threedaysAppointment/:date/id/:apId/emp/:empId/', function (req, res) {

            date = moment(req.params.date);

            //weekStartDate = moment(date).startOf('week');
            // weekEndDate = moment(weekStartDate,"YYYY-DD-MM").add(2,'days')


            startDate = date.format('YYYY-MM-DD');
            endDate = moment(startDate, "YYYY-MM-DD").add(2, 'days').format('YYYY-MM-DD');

            var find = {
                apointmentId: req.params.apId,
                appointmentDate: { $lte: endDate, $gte: startDate },
                spot: false
            };
            if (req.params.empId != 'none') {
                find.employeeId = req.params.empId;
            }

            appointmentCollection.find(find).select('appointmentTime appointmentDate  ').exec(function (err, entity) {

                if (err) {
                    return res.send(err);
                }

                appointmentDefinition.findById(req.params.apId, function (error, definition) {

                    if (error) {
                        return res.send(error);
                    }

                    if (!definition) return;

                    eTDate = moment(definition.effectiveTo);
                    eFDate = moment(definition.effectiveFrom);

                    var dateArray = [];
                    var dateAppointments = {};
                    var currentDate = moment(startDate);

                    appointmentDates = [];
                    validDates = [];

                    while (currentDate <= moment(endDate)) {

                        flag = true;
                        if (moment(currentDate).isBetween(definition.effectiveFrom, definition.effectiveTo, null, '[]') && moment(currentDate) >= moment(new Date().toISOString())) {

                            validDates.push(currentDate.format('YYYY-MM-DD'));

                            if (_.where(entity, { "appointmentDate": currentDate.format('YYYY-MM-DD') }).length) {
                                flag = false;
                                appointmentDates = appointmentDates.concat(_.filter(entity, { appointmentDate: currentDate.format('YYYY-MM-DD') }));
                            }
                        }

                        if (flag) appointmentDates.push({ "appointmentDate": currentDate.format('YYYY-MM-DD') });

                        currentDate = moment(currentDate).add(1, 'days');
                    }

                    appointments = _.chain(appointmentDates).groupBy('appointmentDate').map(function (value, key) {

                        flag = false;
                        if (_.contains(validDates, value[0].appointmentDate)) {
                            flag = true;
                        }

                        items = flag ? value : [];
                        return {
                            date: key,
                            items: items,
                            valid: flag
                        }
                    })
                        .value();

                    res.send(appointments);

                })
            });
        })


        .get('/scheduleAppointment/Appointments/:customerId/:date', function (req, res) {
       userCollection.findOne({ _id: req.params.customerId },function (err, customer) {                       
           if (err) {
               return res.send(err);
           }
            var format= customer.timeFormat == 12 ? 'hh:mm a' : 'HH:mm';
          

            var currentutc = moment.utc().format("YYYY-MM-DD HH:mm");

            var currentlocaldate = utcToLocal(currentutc,user.timeZone,'HH:mm');
            var startdate = moment(currentlocaldate.date + ' '+ '00:00').format('YYYY-MM-DD HH:mm');
            var enddate = moment(currentlocaldate.date+ ' '+'23:59').format('YYYY-MM-DD HH:mm');
            var currentstarttime = localToUtc(startdate,user.timeZone,'HH:mm');
            var currentendtime = localToUtc(enddate,user.timeZone,'HH:mm');
            appointmentCollection.find({
                customerID: req.params.customerId,
               
                appointmentDatetime24:{ $gte : currentstarttime.full , $lte : currentendtime.full}
            }).select('appointmentTime  appointmentDate appointmentTime24 spot serviceProviderID status attended appRefNo').lean().exec(function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                if (entity.length != 0) {
                    var spIds = _.pluck(entity, 'serviceProviderID')
        
                    spIds = _.uniq(spIds);  
      
                        userCollection.find({ _id: { $in: spIds } }).select('firstName lastName addressLane1 addressLane2').exec(function (err, sp) {
                            if (err) {
                                return res.send(err);
                            }
                       
                              var currentutc = moment.utc().format('YYYY-MM-DD ' + 'HH:mm')
                              var currentlocaltime = utcToLocal(currentutc, customer.timeZone, 'HH:mm');
                            _.each(entity, function (item,key) {                               

                                 var localdate = utcToLocal(item.appointmentDate + ' ' +item.appointmentTime24,customer.timeZone,'HH:mm');
                                 item.appointmentTime24 = localdate.time;
                                 item.appointmentDate = localdate.date; 
                                 item.appointmentTime = utcToLocal(item.appointmentDate + ' ' +item.appointmentTime,customer.timeZone,format).time;
                                 _.each(sp, function (spitem) {
                                    if (item.serviceProviderID == spitem._id) {
                                        item.spDetails = spitem;
                                    }
                                })
                                if(item.attended == "Attended Closed"){
                                    item.status = "Closed"                                  
                                }
                                else if(moment(item.appointmentDate + ' ' + item.appointmentTime24).isBefore(moment(currentlocaltime.date + ' ' + currentlocaltime.time)))
                                {
                                    item.status = "UnAttended Closed"                                 
                                   
                                 }                              
                                
                               
                                console.log(item.appointmentTime);
                                
                            })
                            res.send(entity);
                        });
                
                }else{
                    res.send({
                        message : "No data found"
                    })
                }
            });

        });
        })


        .get('/scheduleAppointment/UpcomingAppointments/:customerId/:date', function (req, res) {



            var currentutc = moment.utc().format("YYYY-MM-DD HH:mm");
            var currentlocaldate = utcToLocal(currentutc,user.timeZone,'HH:mm');

            var fromdate =moment(currentlocaldate.date, "YYYY-MM-DD").add(1, 'days');
            var todate = moment(currentlocaldate.date, "YYYY-MM-DD").add(7, 'days');

            var startutcdate = localToUtc(fromdate.format("YYYY-MM-DD")+' '+ "00:00" ,user.timeZone , 'HH:mm')
            var endutctime = localToUtc(todate.format("YYYY-MM-DD")+' ' + '23:59', user.timeZone, 'HH:mm');

            // var currentlocaldate = utcToLocal(currentutc, user.timeZone, 'HH:mm');      
            // var startdate = moment(currentlocaldate.date + ' ' + '00:00').format('YYYY-MM-DD HH:mm');
            // var enddate = moment(endlocaltime.date + ' ' + '23:59').format('YYYY-MM-DD HH:mm');
            // var currentstarttime = localToUtc(startdate, user.timeZone, 'HH:mm');
            // var currentendtime = localToUtc(enddate, user.timeZone, 'HH:mm');

            appointmentCollection.find({
                customerID: req.params.customerId,
                appointmentDatetime24: { $gt:startutcdate.full, $lte: endutctime.full}
            }).select('appointmentTime  appointmentDate spot serviceProviderID status appRefNo sequenceNumber').lean().exec(function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                if (entity != null) {
                    var spIds = _.pluck(entity, 'serviceProviderID')
                    spIds = _.uniq(spIds);
                    userCollection.find({ _id: { $in: spIds } }).select('firstName lastName addressLane1 addressLane2').exec(function (err, sp) {
                        if (err) {
                            return res.send(err);
                        }


                        userCollection.findOne({ _id: req.params.customerId }, function (err, customer) {
                            if (err) {
                                return res.send(err);
                            }
                            var format = customer.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
                            _.each(entity, function (item) {
                                var localdate = utcToLocal(item.appointmentDate + ' ' + item.appointmentTime, customer.timeZone, format)
                                item.appointmentDate = localdate.date;
                                item.appointmentTime = localdate.time;
                                _.each(sp, function (spitem) {
                                    if (item.serviceProviderID == spitem._id) {
                                        item.spDetails = spitem;
                                    }
                                })
                            })
                            res.send(entity);
                        })

                    });
                }
            });
        })

        .get('/scheduleAppointment/previousAppointments/:customerId/:date', function (req, res) {

            var prevDate = moment(req.params.date, "YYYY-MM-DD").subtract(30, 'days').format('YYYY-MM-DD');

            appointmentCollection.find({
                customerID: req.params.customerId,
                appointmentDate: { $gte: prevDate, $lt: req.params.date }
            }).select('appointmentTime  appointmentDate spot serviceProviderID status attended').lean().exec(function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                if (entity != null) {
                    var spIds = _.pluck(entity, 'serviceProviderID')
                    spIds = _.uniq(spIds);
                    userCollection.find({ _id: { $in: spIds } }).select('firstName lastName addressLane1 addressLane2').lean().exec(function (err, sp) {
                        if (err) {
                            return res.send(err);
                        }

                        ServiceProviderRating.find({ serviceProviderId: { $in: spIds } }).select('serviceProviderId rating').lean().exec(function (err, rating) {
                            if (err) {
                                return res.send(err);
                            }

                            var groups = _(rating).groupBy('serviceProviderId');

                            var counts = _.countBy(rating, 'serviceProviderId');

                            var avgRating = _(groups).map(function (g, key) {
                                return {
                                    'serviceProviderId': key,
                                    rating: _(g).reduce(function (m, x) { return parseFloat(m) + parseFloat(x.rating); }, 0) / counts[key]
                                };
                            });
                            // _.each(sp, function (item) {
                            //     _.each(avgRating, function (ratingItem) {
                            //         if (item._id == ratingItem.serviceProviderId) {
                            //             item.rating = ratingItem.rating
                            //         }
                            //     })
                            // })

                            _.each(entity, function (item) {
                                if (item.attended == "Attended Close") {
                                    item.status = "Closed"
                                } else if (item.attended = "Pending") {
                                    item.status = "UnAttended Closed"
                                }
                                _.each(sp, function (spitem) {
                                    if (item.serviceProviderID == spitem._id) {
                                        item.spDetails = spitem;
                                    }
                                    _.each(avgRating, function (ratingItem) {
                                    if (spitem._id == ratingItem.serviceProviderId) {
                                        spitem.rating = ratingItem.rating
                                    }
                                })
                                })
                            })
                            res.send(entity);

                        });
                    });
                }
            });
        })

        .post('/scheduleAppointment/appointmentReport/', function (req, res) {
            console.log(req.body.empId)
            console.log(req.body.id)
            var find = {
                $or: [{ serviceProviderID: req.body.id }, { employeeId: req.body.empId }]
            }

            userCollection.findOne({ $or:[{"_id":req.body.id},{"_id":req.body.empId}] }, function (err, user) {
                if (err) {
                    res.send(err)

                }
           var format = user.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';

            if (req.body.appointmentId != undefined){
          
                find.apointmentId = { $in: req.body.appointmentId };
            }

            if (req.body.date != undefined) {
                var fromDate24 = localToUtc(req.body.date + ' '+ '00:00',user.timeZone,'HH:mm'); 
                var toDate24 = localToUtc(req.body.date + ' '+ '23:59',user.timeZone,'HH:mm'); 
            }

            if (req.body.from != undefined && req.body.to != undefined) {
                var from24 = localToUtc(req.body.from + ' '+ '00:00',user.timeZone,'HH:mm');
                var to24  = localToUtc(req.body.to + ' '+ '23:59',user.timeZone,'HH:mm')
                find.appointmentDatetime24 = { $gte: from24.full, $lte: to24.full }               
            } else {       
                  find.appointmentDatetime24 = { $gte: fromDate24.full, $lte: toDate24.full }
            }
            console.log('---------------')
            console.log(find)

            appointmentCollection.find(find).select('appointmentTime attended employeeId customerID  appointmentDate appointmentName spot status answers appRefNo apointmentId').lean().sort({ appointmentDate: 'desc' }).exec(function (err, entity) {
                if (err) {
                    return res.send(err);
                }

                if (entity.length != 0) {
                
                    var custId = _.pluck(entity, 'customerID')
                    var EmpId = _.pluck(entity, 'employeeId');
                    var custAndEmpArray = custId.concat(EmpId);
                    custAndEmp = _.uniq(custAndEmpArray);
                    userCollection.find({ _id: { $in: custAndEmp } }).select('__t firstName lastName mobilePhone addressLane1 addressLane2 userName appointmentOption').exec(function (err, customerEntity) {
                        if (err) {
                            return res.send(err);
                        }
                        _.each(entity, function (item) {
                            _.each(customerEntity, function (userItem) {
                                if (item.customerID == userItem._id) {

                                    if (userItem.__t == 'Customers') {
                                        item.customerName = userItem.firstName + ' ' + userItem.lastName;
                                        if (userItem.addressLane1 && userItem.addressLane2)
                                            item.customerAddress = userItem.addressLane1 + ' ' + userItem.addressLane2;

                                        item.customerEmail = userItem.userName;
                                        item.customerMobile = userItem._doc.mobilePhone;
                                    }
                                }
                                if (item.employeeId == userItem._id) {
                                    if (userItem.__t == 'Employees') {
                                        item.employeeName = userItem.firstName + ' ' + userItem.lastName;
                                    }
                                }
                            })
                        });

                        for (i = 0; i < entity.length; i++) {

                            if (entity[i].attended == 'Attended Close') {
                                entity[i].status = entity[i].attended;
                            }
                        }
                        appointments = [];
                        for (i = 0; i < entity.length; i++) {
                            appointments.push(entity[i].apointmentId)
                        }

                        appointments = _.uniq(appointments);

                        appointmentDefinition.find({ _id: { $in: appointments } }, function (error, app) {

                            for (i = 0; i < app.length; i++) {

                                timezone = app[i].timeZone;

                                if (app[i].timeFormat == '12') {
                                    format = 'hh:mm a';
                                } else {
                                    format = 'HH:mm';
                                }
                                for (j = 0; j < entity.length; j++) {

                                    if (entity[j].apointmentId == app[i]._id) {

                                        dateTime = entity[j].appointmentDate + ' ' + entity[j].appointmentTime;

                                        localTime = utcToLocal(dateTime, timezone, format);

                                        entity[j].appointmentDate = localTime.date;
                                        entity[j].appointmentTime = localTime.time;
                                    }
                                }
                            }
                            _.each(entity, function (item) {
                                //     console.log(moment())
                                //     console.log(moment.utc().zone(timezone))
                                //     console.log(moment.utc().format('MM/DD/YYYY h:mm A'))
                                //     console.log(moment.utc().zone(timezone).format('MM/DD/YYYY ' +format))
                                var currentutc = moment.utc().zone(timezone).format('YYYY-MM-DD ' + format)
                                var currentlocaltime = utcToLocal(currentutc, timezone, format);
                                //     console.log(moment(currentlocaltime.date));
                                //     console.log(moment(appointmenttime.date));
                                //    // currentlocaltime.date.diff(currentlocaltime.date);
                                //  console.log(moment(item.appointmentDate+' '+item.appointmentTime).isBefore(moment(currentlocaltime.date+' '+currentlocaltime.time)));                     
                                if (moment(item.appointmentDate + ' ' + item.appointmentTime).isBefore(moment(currentlocaltime.date + ' ' + currentlocaltime.time))) {
                                    if (item.status == 'pending' || item.status == 'Pending') { item.status = 'Un Attended Close' }
                                }
                            })
                            res.send({ success: true, entity: entity });
                        })
                    });
                }
                else {
                    res.send({ success: false, message: "No Appointments found" });
                }
            });
              });

        })


    customerApi.put('/appointmentSheduleCheck/:id/update/:action', function (req, res) {
        appointmentCollection.findOneAndUpdate({
            _id: req.params.id
        }, {
                $set: {
                    status: req.params.action,
                }
            }, function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                userCollection.findOne({ _id: entity.customerID }, function (err, user) {
                    if (err) {
                        return res.send(err);
                    }
                    var format = user.timeFormat == 12 ? 'hh:mm a' : 'HH:mm';
                    var localappointmenttime = utcToLocal(entity.appointmentDate + ' '+ entity.appointmentTime,user.timeZone,format);
                    if (req.params.action == "Confirmed") {
                        var message = 'Hi ' + user.firstName + ',<br><br> Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been confirmed.<br>'
                        var pushmessage = 'Hi ' + user.firstName + ', Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been confirmed.'
                    } else {
                        var message = 'Hi ' + user.firstName + ',<br><br> Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been rejected.<br>'
                        var pushmessage = 'Hi ' + user.firstName + ', Your appointment for ' + localappointmenttime.date + ' ' + localappointmenttime.time + ' has been rejected.'
                    }
                    var message = {
                        "subject": 'Appointment',
                        "body": message
                    }
                    sendMail(user.userName, message);
                    var messageData = {
                        "body": pushmessage,
                        "title": "Appointment Updated"
                    }
                    PushNotification(entity.customerID, messageData)
                    res.send({
                        message: 'Appointment updated!'
                    });
                  
                });

            })
    });

    customerApi.post('/appointmentSheduleCheck/:id/update/:action', function (req, res) {
        appointmentCollection.findOneAndUpdate({
            _id: req.params.id
        }, {
                $set: {
                    status: req.params.action,
                }
            }, function (err, entity) {
                if (err) {
                    return res.send(err);
                }
                userCollection.findOne({ _id: entity.customerID }, function (err, user) {
                    if (err) {
                        return res.send(err);
                    }
                    if (req.params.action == "Confirmed") {
                        var message = 'Hi ' + user.firstName + ',<br><br> Your appointment for ' + entity.appointmentDate + ' ' + entity.appointmentTime + ' has been confirmed.<br>'
                        var pushmessage = 'Hi ' + user.firstName + ', Your appointment for ' + entity.appointmentDate + ' ' + entity.appointmentTime + ' has been confirmed.'
                    } else {
                        var message = 'Hi ' + user.firstName + ',<br><br> Your appointment for ' + entity.appointmentDate + ' ' + entity.appointmentTime + ' has been rejected.<br>'
                        var pushmessage = 'Hi ' + user.firstName + ', Your appointment for ' + entity.appointmentDate + ' ' + entity.appointmentTime + ' has been rejected.'
                    }
                    var message = {
                        "subject": 'Appointment',
                        "body": message
                    }
                    sendMail(user.userName, message);
                    var messageData = {
                        "body": pushmessage,
                        "title": "Appointment Updated"
                    }
                    PushNotification(entity.customerID, messageData)
                    res.send({
                        success: true,
                        message: 'Appointment updated!'
                    });
                    console.log("========Updated==========")
                });

            })
    });

    customerApi.route('/customerDetails/customer/:id').get(function (req, res) {

        userCollection.findById(req.params.id).select('firstName lastName mobilePhone userName zipCode addressLane1 addressLane2 city state country zipCode').exec(function (err, customer) {
            res.send(customer);
        })

    });


    customerApi.route('/referenceNumbers/employee/:id/date/:date').get(function (req, res) {

        date = moment(new Date(req.params.date)).format('YYYY-MM-DD');

        var spot = [];
        var regular = [];
userCollection.findOne({ _id: req.params.id }, function (err, user) {
    var timefromat = user.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
        var fromDate24 =  localToUtc(date+ ' '+ '00:00',user.timeZone,'HH:mm'); 
        var toDate24 = localToUtc(date + ' '+ '23:59',user.timeZone,'HH:mm'); 
        appointmentCollection.find({ employeeId: req.params.id, appointmentDatetime24: {$gte: fromDate24.full, $lte: toDate24.full }, status: 'Confirmed', $or: [{ attended: 'Pending' }, { attended: 'UN Attended Close' }] }, function (err, appointments) {

            sortedAppointments = _.sortBy(appointments, function (o) { return moment(o.appointmentTime); })

        
                
                _.each(sortedAppointments, function (item) {
                    item.appointmentTime = utcToLocal(date + ' ' + item.appointmentTime, user.timeZone, timefromat).time;
                })
                for (i = 0; i < sortedAppointments.length; i++) {
                    if (sortedAppointments[i].spot == true) {
                        spot.push(sortedAppointments[i]);
                    } else {
                        regular.push(sortedAppointments[i]);
                    }
                }
                res.send({
                    spot: spot,
                    regular: regular
                })
          
        })

     });   
    });

    customerApi.post('/sendEmail/', function (req, res) {

        var response = res;
        client.transmissions.send({
            transmissionBody: {
                content: {
                    from: 'support@weresol.com',
                    subject: req.body.subject,
                    template_id: 'smart-connect-appointment',
                },
                substitution_data: { receiverName: req.body.details.receiverName, message: req.body.message, senderName: req.body.details.senderName },
                recipients: [
                    { address: req.body.to }
                ]
            }
        },
            function (err, res) {
                if (err) {
                    console.log(err)
                    return response.send({ message: 'oops something went wrong' });
                } else {
                    response.send({
                        message: 'Your message has been sent successfully'
                    });
                }
            });
    });

    customerApi.get('/getscheduledAppointment/refNo/:no/spId/:spId', function (req, res) {
        appointmentCollection.findOne({
            appRefNo: req.params.no,
            $or: [{ serviceProviderID: req.params.spId }, { customerID: req.params.spId }],
            status: { $ne: "Cancelled" }
        }).lean().exec(function (err, entity) {
            if (err) {
                return res.send(err);
            }
            if (entity == null) {
                return res.json({ success: false, message: "No data found" });
            }
            var nowDate = new Date();
            appointmentDefinition.findOne({
                serviceProviderId: req.params.spId, _id: entity.apointmentId
            }).select('appointmentType appointmentCategory appointmentSubCategory employees effectiveTo effectiveFrom questions appointmentId').exec(function (err, appointment) {
                console.log(appointment)
                if (err) {
                    return res.send(err);
                }
                entity.selectedType = appointment.appointmentType;
                entity.selectedCategory = appointment.appointmentCategory;
                entity.selectedSubCategory = appointment.appointmentSubCategory;
                entity.Employees = appointment.employees;
                entity.effectiveFrom = appointment.effectiveFrom;
                entity.effectiveTo = appointment.effectiveTo;
                entity.Questions = appointment.questions;
                if (entity.appointmentName != null) {
                    entity.type = "Regular Appointment";
                    appointmentDefinition.find({
                        $and: [{
                            effectiveFrom: { $lte: nowDate }
                        }, {
                            effectiveTo: { $gte: nowDate }
                        }], serviceProviderId: req.params.spId
                    }).select('_id appointmentType').exec(function (err, type) {
                        console.log(type);
                        if (err) {
                            return res.send(err);
                        }

                        var pure = [];
                        type.forEach(function (item) {
                            var flag = true;
                            pure.forEach(function (item2) {
                                if (item['appointmentType'] == item2['appointmentType']) flag = false;
                            });
                            if (flag) pure.push(item);
                        });
                        entity.Types = pure;
                        appointmentDefinition.find({
                            $and: [{
                                effectiveFrom: { $lte: nowDate }
                            }, {
                                effectiveTo: { $gte: nowDate }
                            }], serviceProviderId: req.params.spId, appointmentType: appointment.appointmentType
                        }).select('_id appointmentCategory').exec(function (err, category) {
                            if (err) {
                                return res.send(err);
                            }
                            var pure = [];
                            category.forEach(function (item) {
                                var flag = true;
                                pure.forEach(function (item2) {
                                    if (item['appointmentCategory'] == item2['appointmentCategory']) flag = false;
                                });
                                if (flag) pure.push(item);
                            });
                            entity.Categories = pure;
                            appointmentDefinition.find({
                                $and: [{
                                    effectiveFrom: { $lte: nowDate }
                                }, {
                                    effectiveTo: { $gte: nowDate }
                                }], serviceProviderId: req.params.spId, appointmentType: appointment.appointmentType, appointmentCategory: appointment.appointmentCategory
                            }).select('_id appointmentSubCategory').exec(function (err, subcategory) {
                                if (err) {
                                    return res.send(err);
                                }
                                var pure = [];
                                subcategory.forEach(function (item) {
                                    var flag = true;
                                    pure.forEach(function (item2) {
                                        if (item['appointmentSubCategory'] == item2['appointmentSubCategory']) flag = false;
                                    });
                                    if (flag) pure.push(item);
                                });
                                entity.SubCategories = pure;

                                appointmentDefinition.find({
                                    $and: [{
                                        effectiveFrom: { $lte: nowDate }
                                    }, {
                                        effectiveTo: { $gte: nowDate }
                                    }], serviceProviderId: req.params.spId, appointmentType: appointment.appointmentType, appointmentCategory: appointment.appointmentCategory, appointmentSubCategory: appointment.appointmentSubCategory
                                }).select('_id appointmentName').exec(function (err, appointmentlist) {
                                    if (err) {
                                        return res.send(err);
                                    }
                                    entity.AppointmentCollection = appointmentlist;
                                    KnowledgebaseContent.find({ appointmentId: appointment.appointmentId, serviceProviderId: req.params.spId }, function (error, contents) {
                                        if (error) {
                                            return res.send(error);
                                        }
                                        url = "http://" + req.headers.host + "/uploads/knowledgebase/";
                                        var filteredContents = _.map(contents, function (model) {
                                            return { _id: model._id, type: model.type, fileName: model.fileName, url: url + model.fileName }
                                        });
                                        entity.KnowledgeBase = filteredContents;
                                        userCollection.findOne({ _id: req.params.spId }).select('__t _id appointmentId appointmentOption approved areaCode country email firstName lastName mobilePhone profilePicUrl rating uniqueId userName zipCode').exec(function (err, sp) {
                                            if (err) {
                                                return res.send(error);
                                            }
                                            var temp = [];
                                            temp.push(sp);
                                            entity.SpDetails = temp;
                                            res.send(entity);
                                        });
                                    });
                                });
                            });
                        });
                    });
                } else {
                    entity.type = "Default Appointment"
                    userCollection.findOne({ _id: req.params.spId }).select('__t _id appointmentId appointmentOption approved areaCode country email firstName lastName mobilePhone profilePicUrl rating uniqueId userName zipCode').exec(function (err, sp) {
                        if (err) {
                            return res.send(error);
                        }
                        var temp = [];
                        temp.push(sp);
                        entity.SpDetails = temp;
                        res.send(entity);
                    });
                }
            });
        });
    })

    function localToUtc(date, offset, format) {
        utc = moment(date, 'YYYY-MM-DD' + format).subtract(offset, 'minutes');
        return {
            date: utc.format('YYYY-MM-DD'),
            time: utc.format(format),
            full: utc.format('YYYY-MM-DD' + ' ' + format)
        }
    }

    function utcToLocal(utc, offset, format) {
        local = moment(utc, 'YYYY-MM-DD' + format).add(offset, 'minutes');
        return {
            date: local.format('YYYY-MM-DD'),
            time: local.format(format),
            full: local.format('YYYY-MM-DD' +' '+ format)
        }
    }

    function time12to24(time){
        return moment(time, ["h:mm A"]).format("HH:mm");
    }

    function sendMail(to, message) {
        client.transmissions.send({
            transmissionBody: {
                content: {
                    from: 'support@weresol.com',
                    subject: message.subject,
                    html: message.body
                },
                recipients: [
                    { address: to }
                ]
            }
        }, function (err, res) {
            if (err) {
                console.log(err)
                return { success: false, message: 'oops something went wrong' };
            } else {
                return {
                    success: true,
                    message: 'Your message has been sent successfully'
                };
            }
        });
    }


    function PushNotification(customerid, messageData) {
        var serverKey = config.firbaseServerKey;
        var fcm = new FCM(serverKey);
        deviceCollection.find({ customerId: customerid }, function (err, device) {
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
    return customerApi;
};

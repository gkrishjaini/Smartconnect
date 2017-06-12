var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var sparkpost = require('sparkpost');
var config = require('../../config');
var user = require('../models/user');
var Employees = require('../models/employee');
var userCollection = mongoose.model('User', user);
var appointmentShedule = require('../models/appointmentShedule');
var appointmentCollection = mongoose.model('appointmentShedule', appointmentShedule);
var closingAttachmentContent = require('../models/closingAttachmentContent');
var closingAttachment = mongoose.model('closingAttachmentContent', closingAttachmentContent);
var device = require('../models/deviceDetails');
var deviceCollection = mongoose.model('Device', device);

var TOKEN_SECRET_STRING = config.secret;
var client = new sparkpost(config.sparkpostKey);
var fs = require('fs');
var FCM = require('fcm-push');

var _ = require('underscore');
var workingDirectory = process.cwd();



module.exports = function(app, express) {

    var employeeApi = express.Router();

    employeeApi.use(function(req, res, next) {

        console.log('call reached the node server for employee  api calls');
        console.log('url is ' + req.url);
        for (var key in req.params) {
            if (object.hasOwnPropertykey) {
                console.log(key);
            }
        }

        var token = req.body.token || req.param('token') || req.headers['x-access-token'];
        console.log(token);
        if (token) {
            jwt.verify(token, TOKEN_SECRET_STRING, function(err, decoded) {

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

    employeeApi.route('/closeAppointment/')
        .post(function(req, res) {

            appointmentCollection.findOneAndUpdate({ _id: req.body.appointmentId }, {
                $set: {
                    comments: req.body.comments,
                    attended: 'Attended Close',
                }
            }, function(err, entity) {

                if (err) {
                    return res.send({ success: false, message: "Something went wrong please try again" });
                }

                appointmentCollection.findById(req.body.appointmentId, function(err, entity) {

                    if (err) {
                        res.send(err);
                    }

                    var appointmentDate = entity.appointmentDate + ' ' + entity.appointmentTime;
                    var referenceNumber = entity.appRefNo;
                    var customerId = entity.customerID;
                    var serviceProviderId = entity.serviceProviderID;
                    var employeeId = entity.employeeId;

                    userCollection.find({
                        '_id': { $in: [
                            mongoose.Types.ObjectId(customerId),
                            mongoose.Types.ObjectId(serviceProviderId), 
                            mongoose.Types.ObjectId(employeeId)
                        ]}
                    },function(err, user) {

                        sp =  _.find(user, function(item) {return item.id == serviceProviderId});
                        customer =  _.find(user, function(item) {return item.id == customerId});
                        employee =  _.find(user, function(item) {return item.id == employeeId});

                        var subject = 'Appointment ' + appointmentDate + ' / ' + referenceNumber
                        message = 'Hi,' + customer.firstName + '<br /> Your appointment has been closed by ';                       
                        message = message + 'Employee: ' + employee.firstName + ' ' + employee.lastName + '<br />';
                        message = message +'Regards <br/>Service Provider: ' + sp.firstName + ' ' + sp.lastName + '<br />';
                        if(req.body.comments!=undefined)
                        message = message + 'Comments: ' + req.body.comments;
                        var message = {
                            "subject": subject,
                            "body": message
                        }
                        var pushmessage = 'Hi ' + customer.firstName + ', Your Appointment has been closed by  ' + employee.firstName  + ' ' + employee.lastName + ' '
                        closingAttachment.find({appointmentId: req.body.appointmentId}, function(error, contents){

                            var attachments = [];

                            for(i=0; i<contents.length; i++) {

                                var fs = require('fs');
                                 
                                var data = fs.readFileSync("public/uploads/closingAttachments/" + contents[i].fileName);

                                var base = data.toString('base64');

                                var obj = {
                                    type: contents[i].type,
                                    name: contents[i].fileName,
                                    data: base
                                }
                                attachments.push(obj);
                            }
                            sendMail(customer.userName,message,attachments)
                            // Send Mail
                            // client.transmissions.send({
                            //     transmissionBody: {
                            //         content: {
                            //             from: 'info@adroitminds.com',
                            //             subject: subject,
                            //             html: message,
                            //             attachments: attachments
                            //         },
                            //         recipients: [
                            //             { address: customer.userName }
                            //         ]
                            //     }
                            // },
                            // function(err, ress) {
                            //     //console.log(ress)
                            //     if(err){
                            //         console.log('oops something went wrong' + err);

                            //     }else{
                            //         console.log('Success :Mail send');
                            //     }  
                            // });
                           
                            var messageData = {
                                "body": pushmessage,
                                "title": "Appointment Closed"
                            }
                             PushNotification(customerId, messageData)
                            return res.send({ success: true, message: 'Appointment closed successfully' });

                        })                              
                    })
                });
            });
        });

    employeeApi.route('/:spId/employee/:empId')
        .get(function(req, res) {

            console.log('find by id will be invoked');

            Employees.findById(req.params.empId, function(err, entity) {
                if (err) {
                    res.send(err);
                }
                res.send(entity);
            });
        })
        .put(function(req, res) {

            console.log('Render service is - ' + req.body.renderSerivce);
            console.log('Super user is - ' + req.body.superUser);
            Employees.update({
                _id: req.params.empId
            }, {
                $set: {

                    effectiveFrom: req.body.effectiveFrom,
                    effectiveTo: req.body.effectiveTo,
                    status: req.body.status,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    designation: req.body.designation,
                    timeZone: req.body.timeZone,
                    description: req.body.description,
                    role: req.body.role,
                    renderService: req.body.renderService,
                    superUser: req.body.superUser,
                    startTime: req.body.startTime,
                    endTime: req.body.endTime,
                    breakTime: req.body.breakTime,
                }
            }, function(err) {

                if (err) {
                    console.log(err);
                    res.send(err);
                }

                res.send({
                    success: true,
                    message: 'Employee updated!'
                });
            });
        })
        .delete(function(req, res) {
            Employees.remove({
                    _id: req.params.empId,
                    serviceProviderId: req.params.spId,
                },
                function(err) {
                    if (err) {
                        res.send(err)
                    }
                    res.send({ message: 'Employee Deleted' })
                })
        });

    employeeApi.route('/:spId/employee')
        .get(function(req, res) {
            Employees.find({
                serviceProviderId: req.params.spId
            }, function(err, employees) {
                if (err) {
                    res.send(err);
                }
                res.json(employees);
            });
        })
        .post(function(req, res) {
            console.log('url is ' + req.url);
            console.log('url parameter :- ' + req.params.spId);

            userCollection.findOne({ userName: new RegExp('^' + req.body.userName + '$', "i") }, function(err, entity) {
                if (entity) {
                    return res.json({
                        success: false,
                        message: 'A user with that username already exists.'
                    });
                } else {

                    var model = new Employees();
                    model.firstName = req.body.firstName;
                    model.lastName = req.body.lastName;
                    model.userName = req.body.userName;
                    model.password = req.body.password;
                    model.effectiveFrom = req.body.effectiveFrom;
                    model.effectiveTo = req.body.effectiveTo;
                    model.status = req.body.status;
                    model.designation = req.body.designation;
                    model.serviceProviderId = req.params.spId;
                    model.timeZone = req.body.timeZone;
                    model.description = req.body.description;
                    model.role = req.body.role;
                    model.renderService = req.body.renderService;
                    model.superUser = req.body.superUser;
                    model.startTime = req.body.startTime;
                    model.endTime = req.body.endTime;
                    model.breakTime = req.body.breakTime;

                    var rand = Math.floor((Math.random() * 90000) + 10000);
                    model.verificationCode = rand;
                    model.EmailVerified = false;

                    model.isAdmin = false;

                    model.save(function(err, room) {
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
                            var id = room._id;
                            console.log(req.headers.host);
                            var link = "http://" + req.headers.host + "/verify/" + rand + "/" + id;
                            client.transmissions.send({
                                    transmissionBody: {
                                        content: {
                                            from: 'support@weresol.com',
                                            subject: 'Employee account',
                                            html: 'Hello ' + req.body.firstName + ',<br><br> Your employee account has been created!'
                                        },
                                        recipients: [
                                            { address: req.body.userName }
                                        ]
                                    }
                                },
                                function(err, res) {
                                    if (err) {
                                        console.log('oops something went wrong');
                                    } else {
                                        console.log('Success :Mail send');
                                    }
                                });
                        }

                        res.json({
                            success: true,
                            message: 'Employee created!'
                        });
                    });
                }
            });
        });


        function sendMail(to, message,attachments) {
            client.transmissions.send({
                transmissionBody: {
                    content: {
                        from: 'support@weresol.com',
                        subject: message.subject,
                        html: message.body,
                        attachments: attachments
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
        deviceCollection.findOne({ customerId: customerid }, function (err, device) {
            if (device != null) {
                var message = {
                    to: device.token,
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
            }
        });
    }

    return employeeApi;
};

angular.module('cCtrl', ['customerService', 'serviceProviderService'])
    .controller('customerController', function(cAppService) {

        var viewModel = this;

        viewModel.processing = true;

        cAppService.all()
            .success(function(data) {
                viewModel.processing = false;
                viewModel.customers = data;
            });

    }).controller('customerCreateController', function(cAppService,lookupAppService, $location, $scope, $mdDialog, Upload) {
        var viewModel = this;

        viewModel.type = 'create';

        //viewModel.countries = ['USA', 'UK', 'India'];

        lookupAppService.regularLookups("Country").then(function(countries) {
            viewModel.countries = _.pluck(countries, 'value');

            console.log(viewModel.countries);

        }, function(error) {
            console.log(error.statusText);
        });

        viewModel.saveCustomer = function() {
            viewModel.processing = true;
            viewModel.message = '';


            if( !viewModel.profilePicUrl ) return;

            viewModel.cData.profilePicUrl = viewModel.profilePicUrl;
            
            if (viewModel.cData.password == viewModel.cData.confirmPassword) {
                cAppService.create(viewModel.cData).then(function(data) {
                    if (data.success != false) {
                        viewModel.processing = false;
                        $location.path('/customer/success');
                    }
                    viewModel.message = data.message;

                }, function(error) {
                    console.log(error)
                });
            }
        };



        viewModel.uploadProfilePicture = function() {
            if (viewModel.cData.profilePic) {
                viewModel.uploadProcess = true;
                var file = viewModel.cData.profilePic;

                Upload.upload({
                    url: 'api/uploadProfilePicture/',
                    data: {
                        file: file
                    }
                }).then(function(resp) {
                    viewModel.uploadProcess = false;
                    viewModel.profilePicUrl = resp.data.name;
                }, null, function(evt) {
                });
            }
        };


        viewModel.cancel = function() {
            $location.path('/');
        };

        var resetForm = function() {
            viewModel.cData = {};
            viewModel.customerform.$setUntouched();
        };

        viewModel.showTermsAndConditionsPopup = function(ev) {
            $mdDialog.show({
                    controller: TermsAndConditionsController,
                    templateUrl: 'app/views/pages/tc.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: false
                })
                .then(function(answer) {
                    //  $scope.status = 'You said the information was "' + answer + '".';
                }, function() {
                    //$scope.status = 'You cancelled the dialog.';
                });
        };

        function TermsAndConditionsController($scope, $mdDialog) {
            $scope.cancelTermsDialog = function() {
                $mdDialog.cancel();
            };
        };

    }).controller('customerHomeController', function() {
        var viewModel = this;

        viewModel.message = "Hi Customer!!!";
    }).controller('customerProfileController', function(lookupAppService, cAppService, Auth, $mdDialog, toaster, Upload) {
        var viewModel = this;
        //viewModel.countries = ['USA', 'UK', 'India'];

        //viewModel.securityQuestions = ['Security Question A?', 'Security Question B?', 'Security Question C?', 'Security Question D?', 'Security Question E?'];
        viewModel.areaOfInterests = ['Music', 'Singing'];

        var customer = {};
        lookupAppService.regularLookups("Country").then(function(countries) {
            viewModel.countries = _.pluck(countries, 'value');

            console.log(viewModel.countries);

        }, function(error) {
            console.log(error.statusText);
        });

        Auth.getUser().success(function(data) {
            customer = data;
            cAppService.get(customer.id)

            .then(function(data) {

                viewModel.cData = data;
                viewModel.profileImgUrl =  viewModel.cData.profilePicUrl ? '/uploads/profilepics/' + viewModel.cData.profilePicUrl : 'assets/img/default.jpg';

                viewModel.cData.securityQuestion1 = data.securityQuestions[0].question;
                viewModel.cData.securityQuestion2 = data.securityQuestions[1].question;
                viewModel.cData.securityQuestion3 = data.securityQuestions[2].question;

                viewModel.cData.answer1 = data.securityQuestions[0].answer;
                viewModel.cData.answer2 = data.securityQuestions[1].answer;
                viewModel.cData.answer3 = data.securityQuestions[2].answer;

                 lookupAppService.get(customer.id, "Security Question")

                    .then(function(securitydata) {
                        viewModel.securityQuestions = _.pluck(securitydata, 'value');
                    }, function(error) {
                        console.log(error.statusText);
                    });

            }, function(error) {
                console.log(error.statusText);
            });
        });

        viewModel.saveCustomer = function() {
            viewModel.processing = true;

            cAppService.update(customer.id, viewModel.cData)
                .then(function(data) {
                        viewModel.processing = false;
                        //resetForm();
                        viewModel.message = data.message;
                        toaster.pop('success', "Success", data.message);
                    },
                    function(error) {
                        console.log(error.statusText);
                    });
        };
        viewModel.cancel = function() {
            resetForm();
        };

        var resetForm = function() {
            viewModel.customerprofileform.$setUntouched();
            viewModel.cData = {};
        }

        viewModel.uploadProfilePicture = function() {
            if (viewModel.cData.profilePic) {
                viewModel.uploadProcess = true;
                var file = viewModel.cData.profilePic;

                Auth.getUser().success(function(user) {

                    Upload.upload({
                        url: 'api/uploadProfilePicture/',
                        data: {
                            file: file,
                            user: user.id
                        }
                    }).then(function(resp) {
                        viewModel.uploadProcess = false;
                        if(resp.data.success) { toaster.pop('success', "Success", 'Profile picture Changed Successfully'); }
                        viewModel.profileImgUrl = '/uploads/profilepics/' + resp.data.name;
                    }, null, function(evt) {
                    });
                });
            }
        };

    }).controller("customerAppointmentScheduleController", function(cAppService, spAppService, Auth, $mdDialog, $filter, toaster,$location) {
        var viewModel = this;

        viewModel.correspondingUser = [], viewModel.user = [], viewModel.appointmentData = {};
        viewModel.selectedServiceProvider = [];
        viewModel.appointmentDefinition = [];
        var appointmentData = [];
        var answers = [];
        viewModel.am = [];
        viewModel.pm = [];
        viewModel.toEdit = false;
        viewModel.patterAmPm = new RegExp("^((0?[1-9])|(1[0-2]))(((:|\s)[0-5]+[0-9]+))$");
        viewModel.patternRailway = new RegExp("^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");

        //viewModel.steps = {step5:{display: true, active: true},step3:{display: true, active: true}, step3:false}

        viewModel.steps = { step1: { display: true, active: true } };

        viewModel.apointmentViews = false;

        Auth.getUser().success(function(data) {

            viewModel.user = data;
            viewModel.displayText = viewModel.user.type == 'ServiceProviders' ? 'Customer' : 'SP';

            cAppService.get(viewModel.user.id).then(function(data) {
                viewModel.user.mobilePhone = data.mobilePhone;
                viewModel.user.country = data.country;
                viewModel.user.areaCode = data.areaCode;
                viewModel.user.email = data.email;
            })
        });

        viewModel.showAppointment = false;
        viewModel.selectItem = function(item) {
            viewModel.resetDropdown();
            viewModel.appointmentTime = undefined;

            viewModel.steps.step5 = { display: false, active: false };
            viewModel.steps.step3 = { display: false, active: false };

            if( item.profilePicUrl ) {
                viewModel.profilePicUrl = item.profilePicUrl;
            } else {
                viewModel.profilePicUrl = null;
            }
            viewModel.selectedItem = item;

            angular.forEach(viewModel.correspondingUser, function(item) {
                item.selected = false;
                viewModel.selectedItem.selected = false;
            });
            viewModel.selectedItem.selected = true;
            viewModel.showAppointment = false;
            viewModel.apointmentViews = false;
        };

        viewModel.getUserTypeId = function() {
            return viewModel.user.type == "ServiceProviders" ? viewModel.user.id : viewModel.selectedItem._id;
        }

        viewModel.showSheduleAppointment = function() {
            viewModel.showAppointment = true;
            viewModel.disableFormAppointment = false;
        }
        viewModel.saveAppointmentDetails = function(ev) {

            viewModel.appointmentData.customeTime = viewModel.apointmentSelectedItem.timeFormat == '12' ? viewModel.appointmentData.customeTime = (viewModel.appointmentData.customeTimeampm + ' ' + viewModel.ampm).toLowerCase() : viewModel.appointmentData.customeTime = viewModel.appointmentData.customeTimeampm;
            viewModel.appointmentTime = viewModel.apSpot ? viewModel.appointmentData.customeTime : viewModel.appointmentTime;

            var currentdate = new Date();
            viewModel.appointmentData.appointmentDate  = viewModel.apSpot ? moment(currentdate).format('YYYY-MM-DD') : moment(viewModel.appointmentData.appointmentDate).format('YYYY-MM-DD');
          //  viewModel.appointmentData.appointmentDate = new Date(date).format('YYYY-MM-DD');

            if (viewModel.appointmentTime == undefined)
                return;

            if (viewModel.prevSpotDetails) {
                format = viewModel.apointmentSelectedItem.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
                var prevTime = moment(viewModel.prevSpotDetails.appointmentTime, format);
                var newTime = moment(viewModel.appointmentData.customeTime, format);
                var appointmentEndTime = moment(viewModel.prevSpotDetails.appointmentEndTime,format)

                var diftime = newTime.diff(prevTime);
                var endtimeDiff = newTime.diff(appointmentEndTime);
                if (diftime < 0) {
                    toaster.pop('info', "Invalid Time", 'Appointment Time should be greater than Last Appointment Time');
                    return;
                }
                if(endtimeDiff >=0){
                    toaster.pop('info', "Invalid Time", "Appointment Time should be less than  Appointment End Time : "+appointmentEndTime._i+"");
                    return;
                }
            }

            var confirm = $mdDialog.confirm()
                  .title('Would you like to schedule?')
                  .textContent('Would you like to schedule an appointment on ' + moment(viewModel.appointmentData.appointmentDate).format('LL') + ' at '  + viewModel.appointmentTime + ' ? ' )
                  .ariaLabel('Lucky day')
                  .targetEvent(ev)
                  .ok('Schedule')
                  .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {

                appointmentData = viewModel.appointmentData;

                appointmentData.appointmentTime = viewModel.appointmentTime;
                appointmentData.appointmentName = viewModel.apointmentSelectedItem.appointmentName;

                appointmentData.customerID = viewModel.selectedItem._id;

                appointmentData.appointmentId = viewModel.appointmentData.apointmentId;
                appointmentData.spEmail = viewModel.selectedItem.userName;
                appointmentData.serviceProviderId = viewModel.user.id;
                appointmentData.customerName = viewModel.selectedItem.firstName + ' ' + viewModel.selectedItem.lastName;

                appointmentData.type = "Service_Provider";
                viewModel.disabled = true;

                appointmentData.anyEmp = viewModel.anyEmployee ? true : false;

                appointmentData.spot = viewModel.apSpot ? true : false;

                angular.forEach(appointmentData.questions, function(list) {
                    if (list.answer)
                        answers.push({
                            'question': list.question,
                            'answer': list.answer
                        })
                });
                appointmentData.answers = answers;

                appointmentData.spuniqueId = viewModel.user.uniqueid;

                appointmentData.noOfEmployees = viewModel.appointmetNoOfEmployees;

                if (viewModel.updation) {
                    appointmentData.updation = true;
                    appointmentData.existingId = viewModel.existingId;
                    appointmentData.appRefNo = viewModel.apprefNo;
                }

                cAppService.createAppointment(appointmentData).then(function(data) {
                    viewModel.disabled = false;
                    viewModel.disableFormAppointment = true;
                    viewModel.appointmentData.spot = false;
                    viewModel.appointmentTime = undefined;
                    viewModel.activeItemSlot = null;
                    viewModel.am = [];
                    viewModel.pm = [];
                    if (data.sequenceNumber != undefined) {
                        viewModel.error = false;
                        viewModel.message = "Sequence Number : " + data.sequenceNumber + ' , ' + "Confirmation Number: " + data.confirmationNumber;
                    }

                    if (!data.success) {
                        viewModel.existingId = null;
                        appointmentData.updation = false;
                        viewModel.disableFormAppointment = false;
                        toaster.pop('error', "An error occured", data.message);
                        viewModel.error = true;
                    } else {
                        toaster.pop('success', "Success", data.message);
                        viewModel.toEdit = false;
                        viewModel.appointmentSlots.appointmentSlots = [];
                        viewModel.anyEmployee = false;
                    }
                }, function(error) {
                    console.log(error)
                });
            }, function() {
              
            });
            

            
            
        }

        viewModel.changeAppointment = function(item) {

            if (viewModel.user.type == "Customers") {
                angular.forEach(viewModel.appointmentDefinition, function(item) {
                    item.selected = false;
                });
                item.selected = true;
            } else {
                viewModel.appontmentItem = item;
                viewModel.selectedItem = item;

                angular.forEach(viewModel.appointmentList, function(item) {
                    item.selected = false;
                    viewModel.selectedItem.selected = false;
                });
                viewModel.selectedItem.selected = true;
                viewModel.changeSelectItem = true;
                cAppService.get(item.customerID).then(function(data) {
                    viewModel.selectedItem = data;
                });

            }
        };

        viewModel.appointmentCheckFormAction = function(action) {
            var update = '';
            var dialogMessage = action == true ? 'Approve' : 'Reject';

            update = action == true ? 'Confirmed' : 'Rejected';

            var confirm = $mdDialog.confirm()
                .title('Would you like to ' + dialogMessage + ' this Appointment?')
                .ariaLabel('Lucky day')
                .ok('Please do it!')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                cAppService.appointmentSheduleCheck(viewModel.appontmentItem._id, update).then(function(data) {
                    appointmentsList(viewModel.user.id);
                    viewModel.changeSelectItem = false;
                });
            }, function() {});
        }

        viewModel.showEmailBox = function(ev) {
            $mdDialog.show({
                locals: {
                    emailDetails: {
                        'senderName': viewModel.user.name,
                        'receiverName': viewModel.selectedItem.firstName,
                        'receiverEmail': viewModel.selectedItem.userName
                    }
                },
                controller: DialogController,
                templateUrl: 'app/views/pages/customer/sendEmail.tmpl.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: true
            }).then(function(answer) {
                // $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                // $scope.status = 'You cancelled the dialog.';
            });

            function DialogController($scope, emailDetails, $mdDialog, cAppService) {

                $scope.email = emailDetails.receiverEmail;

                $scope.sendEmail = function() {
                    $scope.disableForm = true;
                    var emailData = {
                        'details': emailDetails,
                        'to': $scope.email,
                        'subject': 'Appointment Shedule Enquiry',
                        'message': $scope.message
                    }
                    cAppService.sendEmail(emailData).then(function(response) {
                        $scope.responseMessage = response.message;
                    }, function() {

                    });
                }

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
            }
        };

        function appointmentsList(id) {
            cAppService.getAppointmentDetails(viewModel.user.id).then(function(data) {
                viewModel.appointmentList = data;
                viewModel.selectedItem = [];
                viewModel.appontmentItem = [];
            });
        }

        viewModel.getAppointmentType = function() {
            viewModel.resetDropdown();
            spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId() }, method: 'type' }).then(function(data) {
                
                viewModel.steps.step2 = {display: false, active: true}
                if( data.status == 'Default' ) {

                    viewModel.appointmentData = {}; data = data.details; console.log(data)
                    viewModel.appointmentEmployeeCollection = data.employees;
                    viewModel.appointmetNoOfEmployees = data.numberofEmployees;
                    viewModel.appointmentData.displayappointmentId = data.displayAppointmentId;

                    viewModel.appointmentData.apointmentId = data.appointmentId;
                    viewModel.appointmentName = data.appointmentName;
                    viewModel.minDate = new Date(data.effectiveFrom) > new Date() ? new Date(data.effectiveFrom) : new Date();

                    viewModel.timeformat = data.timeFormat;
                    viewModel.patternValid = data.timeFormat == "12" ? viewModel.patterAmPm : viewModel.patternRailway;
                    viewModel.apointmentSelectedItem = data;
                    viewModel.appointmentQuestions = [];
                    viewModel.spot = data.spot = false;
                    viewModel.appointmentSlots = [];
                    viewModel.appointmentQuestions = data.questions;

                    viewModel.steps.step3 = {display: false, active: false};
                    viewModel.steps.step4 = {display: true, active: true};

                } else if(data.status == 'Contact') {
                } else {
                    viewModel.appointmentTypeCollection = data;
                    viewModel.steps.step3 = {display: true, active: true};
                    viewModel.steps.step4 = {display: false, active: false};
                }

            });
        }

        viewModel.resetDropdown = function() {
            viewModel.appointmentType = [];
            viewModel.appointmentCategory = [];
            viewModel.appointmentSubCategory = [];
            viewModel.appointmentId = [];
            viewModel.appointmentName = null;

            viewModel.appointmentTypeCollection = {};
            viewModel.appointmentCategoryCollection = {};
            viewModel.appointmentSubCategoryCollection = {};
            viewModel.appointmentNameCollection = {};

            viewModel.prevSpotDetails = null;
        }


        viewModel.getAppointmentCategory = function() {
            var appointmentType = viewModel.appointmentType;
            viewModel.appointmentCategoryCollection = [];
            viewModel.appointmentSubCategoryCollection = [];
            viewModel.appointmentNameCollection = [];

            // To edit
            viewModel.appointmentCategory = null;
            viewModel.appointmentName = null;
            viewModel.appointmentSubCategory = [];
            viewModel.appointmentId = [];

            spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': appointmentType }, method: 'category' }).then(function(data) {
                viewModel.appointmentCategoryCollection = data;
            });
        }

        viewModel.getAppointmentSubCategory = function() {

            viewModel.appointmentSubCategoryCollection = {};
            viewModel.appointmentNameCollection = {};
            viewModel.appointmentName = null;
            viewModel.appointmentSubCategory = [];
            viewModel.appointmentId = [];
            var appointmentCategory = viewModel.appointmentCategory;
            var appointmentType = viewModel.appointmentType;

            spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': appointmentType, 'appointmentCategory': appointmentCategory }, method: 'subCategory' }).then(function(data) {
                viewModel.appointmentSubCategoryCollection = data;
            });
        }

        viewModel.getAppointmentName = function() {
            viewModel.appointmentNameCollection = {};

            var appointmentSubCategory = viewModel.appointmentSubCategory;
            spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': viewModel.appointmentType, 'appointmentCategory': viewModel.appointmentCategory, 'appointmentSubCategory': appointmentSubCategory }, method: 'names' }).then(function(data) {
                viewModel.appointmentNameCollection = data;
            });
        }

        viewModel.toggle = function() {
            viewModel.ampm = viewModel.ampm == 'AM' ? 'PM' : 'AM'
        }

        viewModel.getAppointment = function(date = null) {

            var appointmentId = viewModel.appointmentId;
            if (!appointmentId) {
                toaster.pop('info', "Not selected", "Please select an Appointment");
                return;
            } 

            spAppService.appointmentList(appointmentId).then(function(data) {
                viewModel.appointmentData = {}; data = data[0];
                viewModel.appointmentEmployeeCollection = data.employees;
                viewModel.appointmetNoOfEmployees = data.numberofEmployees;
                viewModel.appointmentData.displayappointmentId = data.appointmentId;
                viewModel.appointmentData.apointmentId = appointmentId;
                viewModel.maxDate = new Date(data.effectiveTo);
                
                viewModel.minDate = new Date(data.effectiveFrom) > new Date() ? new Date(data.effectiveFrom) : new Date();

                viewModel.timeformat = data.timeFormat;
                viewModel.patternValid = data.timeFormat == "12" ? viewModel.patterAmPm : viewModel.patternRailway;
                viewModel.apointmentSelectedItem = data;
                viewModel.appointmentQuestions = viewModel.apointmentSelectedItem.questions;
                viewModel.spot = data.spot;
                viewModel.appointmentSlots = [];

                if(date)
                    viewModel.getAppointmentSlots(date);
            });

        }
      //  viewModel.getAppointment();

        viewModel.sheduleSlot = function(item) {
            viewModel.activeItemSlot = item;
        }

        viewModel.getAppointmentSlots = function(nextDate = null) {

            if (viewModel.apointmentSelectedItem == undefined ) {
                toaster.pop('info', "Not Selected", "Please select an Appointment");
                return;
            }
            if( viewModel.apointmentSelectedItem.employees.length) {
                if( !viewModel.anyEmployee &&  !viewModel.appointmentData.employeeId ){
                    toaster.pop('info', "Not Selected", "Please select an employee");
                    return;
                }

                if( viewModel.anyEmployee )
                    viewModel.appointmentData.employeeId = undefined;
            }

            var date;
            viewModel.appointmentTime = undefined;
            if (nextDate) {
                date = nextDate;
            } else {
                date = viewModel.appointmentData.appointmentDate;
            }

            pickerWeekStartDate = moment(date).startOf('week'); 
            pickerWeekEndDate = moment(date).endOf('week');
            viewModel.pickerWeekStartEndDateLabel = pickerWeekStartDate.format('YYYY-MM-DD') +  ' - ' + pickerWeekEndDate.format('YYYY-MM-DD');

            pickerWeekStartDateMonth = pickerWeekStartDate.format('MMMM');
            pickerWeekEndDateMonth = pickerWeekEndDate.format('MMMM');
            viewModel.calenderMonth = pickerWeekStartDateMonth == pickerWeekEndDateMonth ? pickerWeekStartDateMonth : pickerWeekStartDateMonth + ' - ' + pickerWeekEndDateMonth

            console.log(viewModel.selectedItem._id)
            cAppService.appointmentWeeks(moment(date).format('YYYY-MM-DD'), viewModel.appointmentData.apointmentId, viewModel.appointmentData.employeeId,viewModel.selectedItem._id).then(function(response) {
                
                viewModel.appointmentData.appointmentDate = new Date(date);
                viewModel.appointmentSlots = response;

            })
        }


        viewModel.resetAppointmentView = function() {
            viewModel.defaulSlotes = [];
            viewModel.appointmentSlots = [];
            viewModel.appointmentData.appointmentDate = new Date();
            viewModel.appointmentTime = null;
            viewModel.prevSpotDetails = null;       
            viewModel.apSpot = viewModel.spotEdittick == true ? true : false;
            viewModel.setDisable = false;
            if (viewModel.spotEdittick) {
                viewModel.spotCheck()
            }
            viewModel.appointmentTime = null;
        }

        viewModel.chooseApTime = function(time, date, available,late=null) {

            if (!available || late) { 
                return 
            };
            viewModel.appointmentTime = time;
            viewModel.appointmentData.appointmentDate = date;
        }

        viewModel.getWeekViewNewWeek = function(flag) {
            viewModel.appointmentTime = null;
            viewModel.activeItemSlot = null;
            
            if (flag == "next")
                newWeek = moment(viewModel.appointmentData.appointmentDate).add(1, 'weeks').startOf('isoWeek').format();
            else
                newWeek = moment(viewModel.appointmentData.appointmentDate).subtract(1, 'weeks').startOf('isoWeek').format();
            
            viewModel.getAppointmentSlots(newWeek);
        }

        viewModel.spotCheck = function() {

            if( viewModel.appointmentEmployeeCollection.length )
                if (!viewModel.appointmentData.employeeId) {
                    toaster.pop('info', "", "Please select employee");
                    return;
                }

            if (viewModel.apSpot) {
                viewModel.setDisable = true;
                viewModel.appointmentData.appointmentDate = moment(new Date()).format('YYYY-MM-DD');
                cAppService.lastAppointment(viewModel.appointmentData.employeeId, viewModel.appointmentData.apointmentId,viewModel.appointmentData.appointmentDate ).then(function(data) {
                    viewModel.prevSpotDetails = data;
                });

            } else {
                viewModel.prevSpotDetails = null;
                viewModel.setDisable = false;
            }
        }

        viewModel.cancelAppointment = function() {

            if( !viewModel.existingId ) return;

            var confirm = $mdDialog.confirm()
                .title('Would you like to cancel this Appointment?')
                .ariaLabel('Lucky day')
                .ok('Please do it!')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                cAppService.cancelAppointment(viewModel.existingId).then(function(data) {
                    if( data.success ) {
                        viewModel.message = "Appoinment has been cancelled!";
                        viewModel.appointmentSlots.appointmentSlots = [];
                        viewModel.disableFormAppointment = true;
                        $location.path('/serviceprovider/appointmentDefinition');
                    }

                });
            }, function() {});

        }

        viewModel.searchAppointment = function(no) {
            if (!no) {
                toaster.pop('info', "Empty search", "Enter something");
                return;
            }

            Auth.getUser().success(function(data) {
                cAppService.getAppointmentDetailsByRefNo(no, viewModel.getUserTypeId()).then(function(data) {
                        if (!data) {
                            toaster.pop('info', "Not found", "Sorry nothing Found");
                            return;
                        }
                        viewModel.updation = true;
                        viewModel.appointmentData.customeTime = null;

                        viewModel.appointmentData.customeTimeampm = null;
                        viewModel.toEdit = true;
                        viewModel.spotEdittick = data.spot == true ? true : false;
                        if(!data.spot) viewModel.setDisable = false;
                        viewModel.appointmentId = data.apointmentId;
                        //viewModel.getAppointment(data.appointmentDate);
                        viewModel.apprefNo = data.appRefNo;
                        var apRefData = data;                         
                        viewModel.existingId = apRefData._id; 
                       
                        cAppService.get(apRefData.customerID).then(function(setCustomer) {


                            viewModel.correspondingUser[0] = setCustomer;
                            if (viewModel.correspondingUser.length != 0) {
                                viewModel.selectedItem = viewModel.correspondingUser[0];
                                viewModel.selectedItem.selected = true;

                                viewModel.resetDropdown();

                                spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId() }, method: 'type' }).then(function(types) {
                                    viewModel.appointmentTypeCollection = types;

                                    spAppService.appointmentList(apRefData.apointmentId).then(function(appointmentData) {
                                        appointmentData = appointmentData[0];

                                        viewModel.apointmentSelectedItem = appointmentData;
                                        viewModel.timeformat = appointmentData.timeFormat;

                                        viewModel.appointmentType = appointmentData.appointmentType;

                                        spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': appointmentData.appointmentType }, method: 'category' }).then(function(category) {
                                            viewModel.appointmentCategoryCollection = category;
                                            viewModel.appointmentCategory = appointmentData.appointmentCategory;

                                            spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': appointmentData.appointmentType, 'appointmentCategory': appointmentData.appointmentCategory }, method: 'subCategory' }).then(function(subCat) {
                                                viewModel.appointmentSubCategoryCollection = subCat;
                                                viewModel.appointmentSubCategory = appointmentData.appointmentSubCategory;

                                                spAppService.allAppointmentList({ data: { 'serviceProviderId': viewModel.getUserTypeId(), 'appointmentType': appointmentData.appointmentType, 'appointmentCategory': appointmentData.appointmentCategory, 'appointmentSubCategory': appointmentData.appointmentSubCategory }, method: 'names' }).then(function(apName) {
                                                    viewModel.appointmentNameCollection = apName;


                                                    viewModel.appointmentId = apRefData.apointmentId;

                                                    var appointmentId = viewModel.appointmentId;

                                                    viewModel.pm = [];
                                                    viewModel.am = [];

                                                    spAppService.appointmentList(appointmentId).then(function(data) {
                                                        console.log(data)

                                                        viewModel.appointmentData = {};
                                                        viewModel.appointmentEmployeeCollection = {};


                                                        viewModel.appointmentEmployeeCollection = data[0].employees;
                                                        viewModel.appointmentData.employeeId = apRefData.employeeId;

                                                        viewModel.appointmentData.apointmentId = appointmentId;
                                                        viewModel.maxDate = new Date(data[0].effectiveTo);

                                                        viewModel.minDate = new Date(data[0].effectiveFrom) > new Date() ? new Date(data[0].effectiveFrom) : new Date();

                                                        viewModel.appointmentData.appointmentDate = new Date(apRefData.appointmentDate);


                                                        viewModel.patternValid = data[0].timeFormat == "12" ? viewModel.patterAmPm : viewModel.patternRailway;

                                                        viewModel.apointmentSelectedItem = data[0];

                                                        
                                                        viewModel.appointmentQuestions = viewModel.apointmentSelectedItem.questions;
                                                        viewModel.appointmentData.questions =[];
                                                          angular.forEach(apRefData.answers, function (value, key) {
                                                           viewModel.appointmentData.questions.push({'question' : value.question,'answer' : value.answer});
                                                          
                                                           })
                                                        viewModel.spot = data[0].spot;
                                                        viewModel.apSpot = apRefData.spot;


                                                        if (!apRefData.spot) {
                                                            viewModel.getAppointmentSlots();
                                                        } else {
                                                            viewModel.appointmentData.customeTime = apRefData.appointmentTime;
                                                            viewModel.spotCheck();
                                                        }

                                                        viewModel.steps = {
                                                            step1: { display: false, active: true },
                                                            step2: { display: false, active: true },
                                                            step3: { display: false, active: true },
                                                            step4: {display: false, active: true},
                                                            step5: { display: true, active: true }
                                                        }; 
                                                        if( viewModel.user.appointmentOption != 'Regular' ) {

                                                            viewModel.steps.step3 = {display: false, active: false};
                                                            viewModel.steps.step4 = {display: false, active: true};
                                                        }

                                                    });
                                                });

                                            });

                                        });


                                    }, function(error) {
                                        console.log(error.statusText);
                                    });

                                });
                            }

                        }, function(error) {
                            console.log(error.statusText);
                        });
                    })
            });
        }

        viewModel.searchSpCustomer = function() {
            viewModel.correspondingUser = [];
            viewModel.selectedItem = [];
            var searchData = {};
            var flag = 0;
            for (var key in viewModel.searchItems) {
                if (viewModel.searchItems.hasOwnProperty(key)) {
                    var trim = viewModel.searchItems[key].replace(/ /g, '');
                    if (trim)
                        flag++;
                }
            }

            searchData.data = viewModel.searchItems;
            searchData.type = viewModel.user.type == 'ServiceProviders' ? 'Customers' : 'ServiceProviders';

            if (flag) {
                spAppService.spSearch(searchData).then(function(data) { console.log(data)
                    viewModel.correspondingUser = data;
                    if (viewModel.correspondingUser.length != 0) {
                        viewModel.steps.step1 = { display: false, active: true };
                        viewModel.steps.step2 = { display: true, active: true };
                        viewModel.selectedItem = viewModel.correspondingUser[0];
                        viewModel.selectedItem.selected = true;
                    } else {
                        toaster.pop('info', "No customer found", 'Sorry, there are no customers to display');
                        viewModel.steps = { step1: { display: true, active: true } };
                    }
                });
            }
        }

        viewModel.changeTabView = function(index) {

            if (viewModel.steps[index].active) {
                angular.forEach(viewModel.steps, function(value, key) {
                    value.display = false;
                })
                viewModel.steps[index].display = true;
            }
        }

        viewModel.selectAnyEmployee = function() {
            viewModel.apSpot = false;

            viewModel.setDisable = false;

            viewModel.appointmentSlots.appointmentSlots = [];
            viewModel.appointmentData.employeeId = null;
        }

    }).controller('landingPageController', function( spAppService, Auth, landingPage ){

        viewModel = this;

        
    })

angular.module('spCtrl', ['ngFileUpload', 'serviceProviderService', 'angular-timezone-selector'])
    .controller('serviceProviderController', function(spAppService, authService) {

        var viewModel = this;

        viewModel.serviceProviders = {};
        viewModel.serviceProviders = {
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 2,
            paginationPageSizes: [10, 25, 50, 75],
            paginationPageSize: 10,
            columnDefs: [{
                name: 'id',
                visible: false
            }, {
                name: 'Name'
            }, {
                name: 'User Name'
            }, {
                name: 'Company Name'
            }, {
                name: 'Phone'
            }, {
                name: 'Email'
            }, {
                name: 'Country'
            }, {
                name: 'Zip Code'
            }],

            rowHeight: 50,
        };

        viewModel.processing = true;

        spAppService.all()
            .then(function(data) {
                viewModel.processing = false;

                viewModel.serviceProviders.data = [];
                angular.forEach(data, function(item) {
                    viewModel.serviceProviders.data.push({
                        "id": item._id,
                        "Name": item.firstName + " " + item.lastName,
                        "User Name": item.userName,
                        "Company Name": item.companyName,
                        "Phone": item.areaCode + " " + item.mobilePhone,
                        "Email": item.email,
                        "Country": item.country,
                        "Zip Code": item.zipCode
                    });
                });
            }, function(error) {
                console.log(error.statusText);
            });

    })

.controller('serviceProviderVerifyController', function(spAppService, $routeParams) {
        var viewModel = this;
        spAppService.verify($routeParams.code, $routeParams.id)
            .then(function(data) {
                    viewModel.message = data.message;
                },
                function(error) {
                    console.log(error.statusText);
                })
    })
    .controller('serviceProviderCreateController', function(spAppService, $location, $scope, $mdDialog, Upload, lookupAppService) {

        var viewModel = this;

        viewModel.type = 'create';

        //viewModel.countries = ['USA', 'UK', 'India'];

        lookupAppService.regularLookups("Country").then(function(countries) {
            viewModel.countries = _.pluck(countries, 'value');

            console.log(viewModel.countries);

        }, function(error) {
            console.log(error.statusText);
        });

        viewModel.saveServiceProvider = function() {
            viewModel.processing = true;
            viewModel.message = '';


            if (viewModel.spData.password != viewModel.spData.confirmPasword) return;

            if (!viewModel.profilePicUrl) return;

            viewModel.spData.profilePicUrl = viewModel.profilePicUrl;

            spAppService.create(viewModel.spData).then(function(data) {
                if (data.success != false) {
                    viewModel.processing = false;
                    $location.path('/serviceprovider/success');
                }
                viewModel.message = data.message;

            }, function(error) {
                console.log(error.statusText);
            });

        };

        viewModel.uploadProfilePicture = function() {
            if (viewModel.spData.profilePic) {
                viewModel.uploadProcess = true;
                var file = viewModel.spData.profilePic;

                Upload.upload({
                    url: 'api/uploadProfilePicture/',
                    data: {
                        file: file
                    }
                }).then(function(resp) {
                    viewModel.uploadProcess = false;
                    viewModel.profilePicUrl = resp.data.name;
                }, null, function(evt) {});
            }
        };

        viewModel.cancel = function() {
            $location.path('/');
        };

        var resetForm = function() {
            viewModel.spForm.$setUntouched();
            viewModel.spData = {};
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

    }).controller('serviceProviderHomeController', function() {
        var viewModel = this;

        viewModel.message = "Hi Service provider!!!";
    }).controller('serviceProviderProfileController', function(spAppService, Auth, Upload, lookupAppService, $mdDialog, VerifyMobile, toaster, $rootScope, moment) {

        

        var viewModel = this;
        //viewModel.countries = ['USA', 'UK', 'India'];
        //viewModel.patterAmPm = new RegExp("^((0?[1-9])|(1[0-2]))(((:|\s)[0-5]+[0-9]+))$");
        viewModel.patterAmPm = new RegExp("^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");
        viewModel.patternRailway = new RegExp("^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");
        viewModel.spData = {};
        viewModel.required = [];
        viewModel.questions = [];
        viewModel.indexValues = [];
        viewModel.requirementsQuestions = [];
        //viewModel.securityQuestions = ['Security Question A?', 'Security Question B?', 'Security Question C?', 'Security Question D?', 'Security Question E?'];
        // viewModel.businessCategories = ['Medical', 'Transport Services', 'Restaurant'];
        //viewModel.businessAres = ['Medical', 'Transportation', 'Law Services', 'Financial Services', 'Tutering Services', 'Plumbing Services', 'Gardening Services', 'Carpenter Services', 'Handyman Services', 'Servernt Maid Services', 'Others'];


        
        lookupAppService.regularLookups("Country").then(function(countries) {
            viewModel.countries = _.pluck(countries, 'value');

            console.log(viewModel.countries);

        }, function(error) {
            console.log(error.statusText);
        });

        var serviceProvider = {};

        viewModel.clear = function() {
            viewModel.spData.files = [];
            viewModel.log = '';
        };
        viewModel.upload = function() {
            if (viewModel.spData.files && viewModel.spData.files.length) {
                for (var i = 0; i < viewModel.spData.files.length; i++) {
                    var file = viewModel.spData.files[i];
                    if (!file.$error) {
                        Upload.upload({
                            url: 'api/serviceprovider/uploads',
                            data: {
                                username: serviceProvider.userName,
                                userid: serviceProvider.id,
                                file: file
                            }
                        }).then(function(resp) {}, null, function(evt) {
                            var progressPercentage = parseInt(100.0 *
                                evt.loaded / evt.total);
                            viewModel.log = 'progress: ' + progressPercentage +
                                '% ' + evt.config.data.file.name + '\n';
                            // + viewModel.log;

                            if (progressPercentage == 100) {
                                viewModel.log = 'upload finsihed for the file' + evt.config.data.file.name;
                                // + '\n' + viewModel.log;
                            }
                        });
                    }
                }
            }
        };

        viewModel.viewUploadedContents = function(user) {
            Auth.getUser()
                .success(function(user) {
                    spAppService.getUploads(user.id).then(function(data) {
                        if (data.success != false) {
                            viewModel.uploadContents = data;
                            uploadDataMagPopup();
                        }
                    }, function(error) {
                        console.log(error.statusText);
                    });
                });

        }

        viewModel.deletUploadedFile = function(conent_id) {
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this?')
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                spAppService.deleteUploads(conent_id, serviceProvider.id)
                    .then(function(data) {
                        viewModel.viewUploadedContents();
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });
        }

        viewModel.showRequirements = function(ev) {
            $mdDialog.show({
                    controller: requirementsController,
                    templateUrl: 'app/views/pages/sp/requirements.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: true
                })
                .then(function(answer) {
                    //$scope.status = 'You said the information was "' + answer + '".';
                }, function() {
                    //$scope.status = 'You cancelled the dialog.';
                });
        }

        function requirementsController($scope, $mdDialog) {

            //$scope.indexValues = viewModel.requirements;

            $scope.indexValues = viewModel.indexValues;
            $scope.required = viewModel.required;
            $scope.questions = viewModel.questions;
            $scope.required[0] = true;

            console.log($scope.questions)

            $scope.cancelTermsDialog = function() {
                $mdDialog.cancel();
            };
            var value = 1;
            $scope.addRequirement = function() { 
                value = 1 + value;
                $scope.indexValues.push(value);
            }

            $scope.removeRequirement = function(data) {
                var index = $scope.indexValues.indexOf(data);
                if (index > -1) {
                    $scope.indexValues.splice(index, 1);
                    $scope.remove.push(data - 1);
                }
            }

            $scope.requirementsSubmit = function() {
                viewModel.requirementsQuestions = [];
                for (var i = 0; i < $scope.questions.length; i++) {
                    flag = i == 0 ? true : ($scope.required[i] == undefined ? false : $scope.required[i]);
                    var found = $.inArray(i, $scope.remove) > -1;
                    if (!found) {
                        viewModel.requirementsQuestions.push({
                            'id': i,
                            'question': $scope.questions[i] ? $scope.questions[i] : null,
                            'required': flag
                        });
                    }
                }

            }
        };

        Auth.getUser()
            .success(function(user) {

                serviceProvider = user;

                lookupAppService.get(user.id, "Security Question")

                .then(function(securitydata) {
                    viewModel.securityQuestions = _.pluck(securitydata, 'value');
                }, function(error) {
                    console.log(error.statusText);
                });

                lookupAppService.get(user.id, "Business Area").then(function(businessAres) {
                    viewModel.businessAres = _.pluck(businessAres, 'value');
                }, function(error) {
                    console.log(error.statusText);
                });

                lookupAppService.get(user.id, "Business Category")

                .then(function(businessCategory) {
                    viewModel.businessCategories = _.pluck(businessCategory, 'value');
                }, function(error) {
                    console.log(error.statusText);
                });

                lookupAppService.get(user.id, "Appointment Options")
                    .then(function(appointmentdata) {
                        viewModel.appointmentOptions = _.pluck(appointmentdata, 'value');
                    }, function(error) {
                        console.log(error.statusText);
                    });

                spAppService.get(user.id)
                    .then(function(data) {
                        viewModel.spData = data;

                        if( !data.effectiveFrom ) {
                            viewModel.spData.effectiveFrom = new Date();
                        }

                        angular.forEach(viewModel.spData.requirements, function(item, key) {
                            viewModel.questions.push(item.question);
                            viewModel.required.push(item.required);
                            var temp = key + 2;
                            viewModel.indexValues.push(temp);

                            viewModel.requirementsQuestions.push({
                                'id': key,
                                'question': item.question ? item.question : null,
                                'required': item.required
                            });

                        });
                        viewModel.indexValues = viewModel.indexValues.slice(0, -1);
                        value = viewModel.indexValues.length + 1;



                        viewModel.profileImgUrl = viewModel.spData.profilePicUrl ? '/uploads/profilepics/' + viewModel.spData.profilePicUrl : 'assets/img/default.jpg';

                        viewModel.currentMobileNo = parseInt(viewModel.spData.mobilePhone);

                        viewModel.patternValid = data.timeFormat == "12" ? viewModel.patterAmPm : viewModel.patternRailway;

                        viewModel.spData.effectiveFrom = new Date(data.effectiveFrom);

                        if (data.securityQuestions.length) {
                            viewModel.spData.securityQuestion1 = data.securityQuestions[0].question;
                            viewModel.spData.securityQuestion2 = data.securityQuestions[1].question;
                            viewModel.spData.securityQuestion3 = data.securityQuestions[2].question;

                            viewModel.spData.answer1 = data.securityQuestions[0].answer;
                            viewModel.spData.answer2 = data.securityQuestions[1].answer;
                            viewModel.spData.answer3 = data.securityQuestions[2].answer;
                        }

                        if (!data.timeFormat) {
                            viewModel.spData.timeFormat = '12';
                        }
                        if (!data.effectiveFrom) {
                            viewModel.spData.effectiveFrom = new Date();
                        }

                        if (!data.startTime || !data.endTime) {
                            viewModel.spData.startampm = 'AM';
                            viewModel.spData.endampm = 'AM';
                            viewModel.spData.breakendampm = 'AM';
                            viewModel.spData.breakstartampm = 'AM';
                        } else {
                            if (data.timeFormat == "12") {
                                viewModel.spData.startampm = data.startTime.substr(6, 4).toUpperCase();
                                viewModel.spData.endampm = data.endTime.substr(6, 4).toUpperCase();
                                viewModel.spData.breakstartampm = data.breakStartTime.substr(6, 4).toUpperCase();
                                viewModel.spData.breakendampm = data.breakEndTime.substr(6, 4).toUpperCase();

                                viewModel.spData.startTime = data.startTime.substring(0, data.startTime.indexOf(' '));
                                viewModel.spData.endTime = data.endTime.substring(0, data.endTime.indexOf(' '));
                                viewModel.spData.breakStartTime = data.breakStartTime.substring(0, data.breakStartTime.indexOf(' '));
                                viewModel.spData.breakEndTime = data.breakEndTime.substring(0, data.breakEndTime.indexOf(' '));
                            } else {
                                viewModel.spData.startTime = data.startTime;
                                viewModel.spData.endTime = data.endTime;
                                viewModel.spData.breakStartTime = data.breakStartTime;
                                viewModel.spData.breakEndTime = data.breakEndTime;
                                viewModel.spData.startampm = 'AM';
                                viewModel.spData.endampm = 'AM';
                                viewModel.spData.breakstartampm = 'AM';
                                viewModel.spData.breakendampm = 'AM';
                            }
                        }


                    }, function(error) {
                        console.log(error.statusText);
                    });

            });

        viewModel.toggle = function(flag, html) {
            if (flag == 1) {
                viewModel.spData.startampm = viewModel.spData.startampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html);
            }
            if (flag == 2) {
                viewModel.spData.endampm = viewModel.spData.endampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html);
            }
            if (flag == 3) {
                viewModel.spData.breakstartampm = viewModel.spData.breakstartampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html)
            }
            if (flag == 4) {
                viewModel.spData.breakendampm = viewModel.spData.breakendampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html)
            }
        }

        function validTimeCheck(sTime, eTime, format) {

            var sTime = moment(sTime, format);
            var eTime = moment(eTime, format);

            var diftime = eTime.diff(sTime);
            if (diftime < 0)
                return false;
            else
                return true;
        }

        viewModel.validateTime = function(control) {
            var eTflag;
            var bSflag;
            var bEflag;
            //var timeFormat = viewModel.appData.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
            var timeFormat = 'HH:mm';
            if (viewModel.spData.timeFormat == '12') {
                var startTime = viewModel.spData.startTime + ' ' + viewModel.spData.startampm.toLowerCase();
                startTime = moment(startTime, ["h:mm A"]).format("HH:mm");
                var endTime = viewModel.spData.endTime + ' ' + viewModel.spData.endampm.toLowerCase();
                endTime = moment(endTime, ["h:mm A"]).format("HH:mm");
                var breakStartTime = viewModel.spData.breakStartTime + ' ' + viewModel.spData.breakstartampm.toLowerCase();
                breakStartTime = moment(breakStartTime, ["h:mm A"]).format("HH:mm");
                var breakEndTime = viewModel.spData.breakEndTime + ' ' + viewModel.spData.breakendampm.toLowerCase();
                breakEndTime = moment(breakEndTime, ["h:mm A"]).format("HH:mm");
            } else {
                var startTime = viewModel.spData.startTime;
                var endTime = viewModel.spData.endTime;
                var breakStartTime = viewModel.spData.breakStartTime;
                var breakEndTime = viewModel.spData.breakEndTime;
            }

            if (!validTimeCheck(startTime, endTime, timeFormat)) {
                viewModel.eTeerrorMessages = [{ type: "eTdynamicmessage", text: "End time must me greater than Start time" }];
                control.$setValidity('eTdynamicmessage', false);
                eTflag = true;
            }
            if (!validTimeCheck(breakStartTime, endTime, timeFormat)) {
                viewModel.bSerrorMessages = [{ type: "bSdynamicmessage", text: "Break start time must be less than End time" }];
                control.$setValidity('bSdynamicmessage', false);
                bSflag = true;
            }

            if (!validTimeCheck(startTime, breakStartTime, timeFormat)) {
                viewModel.bSerrorMessages = [{ type: "bSdynamicmessage", text: "Break start time must be greater than Start time" }];
                control.$setValidity('bSdynamicmessage', false);
                bSflag = true;
            }

            if (!validTimeCheck(breakStartTime, breakEndTime, timeFormat)) {
                viewModel.bEerrorMessages = [{ type: "bEdynamicmessage", text: "Break end time must be greater than Break start time" }];
                control.$setValidity('bEdynamicmessage', false);
                bEflag = true;
            }

            if (!validTimeCheck(breakEndTime, endTime, timeFormat)) {
                viewModel.bEerrorMessages = [{ type: "bEdynamicmessage", text: "Break end time must be less than End" }];
                control.$setValidity('bEdynamicmessage', false);
                bEflag = true;
            }

            if (!eTflag)
                control.$setValidity('eTdynamicmessage', true);

            if (!bSflag)
                control.$setValidity('bSdynamicmessage', true);

            if (!bEflag)
                control.$setValidity('bEdynamicmessage', true);
        }

        viewModel.uploadProfilePicture = function() {
            if (viewModel.spData.profilePic) {
                viewModel.uploadProcess = true;
                var file = viewModel.spData.profilePic;

                Auth.getUser().success(function(user) {

                    Upload.upload({
                        url: 'api/uploadProfilePicture/',
                        data: {
                            file: file,
                            user: user.id
                        }
                    }).then(function(resp) {
                        viewModel.uploadProcess = false;
                        if (resp.data.success) { toaster.pop('success', "Success", 'Profile picture Changed Successfully'); }
                        viewModel.profileImgUrl = '/uploads/profilepics/' + resp.data.name;
                    }, null, function(evt) {});
                });
            }
        };

        viewModel.saveServiceProvider = function() {

            console.log(viewModel.spData);

            //viewModel.spData.timeZone = moment.tz(viewModel.spData.timeZone).utcOffset();

            // for demo
            viewModel.spData.effectiveFrom = new Date(moment(viewModel.spData.effectiveFrom).format('YYYY-MM-DD'));
            if ((viewModel.currentMobileNo != viewModel.spData.mobilePhone) && viewModel.spData.areaCode) {
                //VerifyMobile.SMSRequest(serviceProvider.id, viewModel.spData.areaCode + viewModel.spData.mobilePhone).success(function(data) {
                    // 
                    //if (data.success)
                        //viewModel.currentMobileNo = viewModel.spData.mobilePhone;
               // });
            }

            if( viewModel.spData.appointmentOption == 'Default') { console.log(viewModel.requirementsQuestions)
                if( !viewModel.requirementsQuestions.length ) {
                    return;
                }

                viewModel.spData.appointmentQuestions = viewModel.requirementsQuestions;
            }

            spAppService.update(serviceProvider.id, viewModel.spData).then(function(data) {

                    // viewModel.message = data.message;
                    toaster.pop('success', "Success", data.message);

                    if( serviceProvider.appointmentOption != viewModel.spData.appointmentOption ) {
                        toaster.pop('info', "Success", "Please login again for the changes to take effect");
                    }

                    //viewModel.user.appointmentOption = viewModel.spData.appointmentOption

                },
                function(error) {
                    console.log(error.statusText);
                });
        }

        var uploadDataMagPopup = function() {
            // if( $('.upload-data-content-over-wrapper').find( "a" ).length ) {
            $('.upload-data-content-over-wrapper').magnificPopup({
                delegate: 'a',
                type: 'image',
                closeOnContentClick: true,
                closeBtnInside: false,
                fixedContentPos: true,
                gallery: {
                    enabled: true
                },
                zoom: {
                    enabled: true,
                    duration: 300,
                    easing: 'ease-in-out',
                    opener: function(openerElement) {
                        return openerElement.is('div') ? openerElement : openerElement.find('div');
                    }
                }
            });
            // }
        }
    }).controller('serviceProviderAppointmentDefinitionController', function(spAppService, Auth, Upload, lookupAppService, empAppService, $mdDialog, $routeParams, $sce, $timeout, toaster, $location) {

        var viewModel = this;
        viewModel.selectedTab = 0
        var value = 1;
        viewModel.indexValues = [];
        viewModel.remove = [];
        viewModel.required = [];
        viewModel.appData = {};
        viewModel.status = ['Pending', 'Active', 'Inactive'];
        viewModel.questions = [];


        //viewModel.patterAmPm = new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [APap][mM]$");
        //viewModel.patterAmPm = new RegExp("^((0?[1-9])|(1[0-2]))(((:|\s)[0-5]+[0-9]+))$");
        viewModel.patterAmPm = new RegExp("^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");
        viewModel.patternRailway = new RegExp("^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");

        if ($routeParams.flag == undefined) {
            viewModel.toEdit = true;
        } else {
            viewModel.toEdit = false;
        }

        if ($routeParams.id == undefined) {
            viewModel.toEdit = false;
            viewModel.disableKnowlegebaseTab = true;
            viewModel.appData.status = viewModel.status[1];
            viewModel.appData.noOfEmployees = null;
            viewModel.appData.displayEmployee = null;
            viewModel.appData.effectiveFrom = new Date();
            viewModel.appData.effectiveTo = new Date();
            viewModel.patternValid = viewModel.patterAmPm;
        } else {
            spAppService.appointmentList($routeParams.id)
                .then(function(data) {
                    if (data.length != 0) {
                        viewModel.appData = {};
                        viewModel.disableKnowlegebaseTab = false;
                        viewModel.appData.displayEmployee = [];
                        viewModel.appointmentId = data[0]._id;
                        viewModel.appData.appointmentName = data[0].appointmentName;
                        if (viewModel.toEdit == true) {
                            viewModel.appData.appointmentID = data[0].appointmentId;
                            viewModel.appointmentID = data[0].appointmentId;
                        } else {
                            // viewModel.appData.appointmentID = data[0].serviceProviderId + Math.floor((Math.random() * 9999) + 1000);
                            viewModel.appointmentID = data[0].appointmentId;
                        }
                        viewModel.selectedValue = data[0].appointmentType;
                        viewModel.categoryselectedValue = data[0].appointmentCategory;
                        viewModel.subcategoryselectedValue = data[0].appointmentSubCategory;
                        viewModel.appData.noOfEmployees = parseInt(data[0].numberofEmployees);
                        viewModel.selectedEmployees = data[0].employees;
                        angular.forEach(data[0].employees, function(item) {
                            viewModel.appData.displayEmployee.push(item.employeeID);
                        });
                        angular.forEach(data[0].questions, function(item, key) {
                            viewModel.questions.push(item.question);
                            viewModel.required.push(item.required);
                            var temp = key + 2;
                            viewModel.indexValues.push(temp);
                        });
                        viewModel.indexValues = viewModel.indexValues.slice(0, -1);
                        value = viewModel.indexValues.length + 1;
                        viewModel.appData.effectiveFrom = new Date(data[0].effectiveFrom);
                        viewModel.appData.effectiveTo = new Date(data[0].effectiveTo);
                        viewModel.appData.averageAppTime = data[0].averageAppoinmentTime;
                        viewModel.appData.status = data[0].status;
                        if (data[0].timeFormat == "12") {
                            viewModel.appData.startTime1 = data[0].startTime.substring(0, data[0].startTime.indexOf(' '));
                            viewModel.appData.endTime1 = data[0].endTime.substring(0, data[0].endTime.indexOf(' '));
                            viewModel.appData.breakStartTime1 = data[0].breakstartTime.substring(0, data[0].breakstartTime.indexOf(' '));
                            viewModel.appData.breakEndTime1 = data[0].breakendTime.substring(0, data[0].breakendTime.indexOf(' '));
                            viewModel.appData.startampm = data[0].startTime.substring(data[0].startTime.indexOf(" ") + 1).toUpperCase();
                            viewModel.appData.endampm = data[0].endTime.substring(data[0].endTime.indexOf(" ") + 1).toUpperCase();
                            viewModel.appData.breakstartampm = data[0].breakendTime.substring(data[0].breakendTime.indexOf(" ") + 1).toUpperCase();
                            viewModel.appData.breakendampm = data[0].breakendTime.substring(data[0].breakendTime.indexOf(" ") + 1).toUpperCase();
                        } else {
                            viewModel.appData.startTime1 = data[0].startTime;
                            viewModel.appData.endTime1 = data[0].endTime;
                            viewModel.appData.breakStartTime1 = data[0].breakstartTime;
                            viewModel.appData.breakEndTime1 = data[0].breakendTime;
                            viewModel.appData.startampm = 'AM';
                            viewModel.appData.endampm = 'AM';
                            viewModel.appData.breakstartampm = 'AM';
                            viewModel.appData.breakendampm = 'AM';
                        }

                        viewModel.appData.timeFormat = data[0].timeFormat;
                        viewModel.patternValid = viewModel.appData.timeFormat == "12" ? viewModel.patterAmPm : viewModel.patternRailway;
                        viewModel.appData.spot = data[0].spot;
                        viewModel.appData.timeZone = data[0].timeZone;
                    }
                }, function(error) {
                    console.log(error.statusText);
                });
        }

        Auth.getUser().success(function(user) {
            viewModel.spData = user;
            viewModel.serviceProviderId = user.id;

            lookupAppService.get(user.id, "Appointment Type").then(function(data) {
                viewModel.appointmentType = _.pluck(data, 'value');
            }, function(error) {
                console.log(error.statusText);
            });

            lookupAppService.get(user.id, "Appointment Category").then(function(data) {
                viewModel.appointment = data;
                viewModel.appointmentCategory = _.pluck(data, 'value');
            }, function(error) {
                console.log(error.statusText);
            });

            empAppService.all(user.id).then(function(data) {
                viewModel.processing = false;
                viewModel.employees = data;
                viewModel.activeEmployees = [];
                viewModel.displayEmployee = [];
                var nowDate = new Date().toISOString();
                angular.forEach(data, function(item) {
                    if (nowDate <= item.effectiveTo && nowDate >= item.effectiveFrom && item.renderService == true) {
                        viewModel.activeEmployees.push(item);
                        viewModel.displayEmployee.push({
                            'id': item._id,
                            'name': item.firstName + ' ' + item.lastName
                        });
                    }
                });
            }, function(error) {
                console.log(error.statusText);
            });

            spAppService.AppointmentCount(user.id).then(function(data) {
                if (viewModel.toEdit != true) {
                    viewModel.appData.appointmentID = user.uniqueid + "-" + (data + 1);
                }
            });

        });

        viewModel.GetSubAppointmentCategory = function() {
            var parentLookup = null;
            angular.forEach(viewModel.appointment, function(item, key) {
                if (item.value == viewModel.appData.appointmentCategory) {
                    parentLookup = item;
                }
            });

            lookupAppService.getSubCategory(parentLookup._id, parentLookup.serviceProviderId).then(function(subcategory) {
                viewModel.appoinmentSubCategory = [];
                viewModel.appoinmentSubCategory = _.pluck(subcategory[0].subCategory, 'value');;
            }, function(error) {
                console.log(error.statusText);
            });
        }

        viewModel.displayEmployeeSelection = function() {
            if (viewModel.appData.noOfEmployees == undefined) {
                $('._md-select-menu-container ').removeClass('_md-active _md-clickable');
                $('._md-select-backdrop').css('z-index', '70');
                viewModel.Data = viewModel.appData.displayEmployee;
                var itemPosition = viewModel.Data.lastIndexOf(_.last(viewModel.Data));
                viewModel.Data = viewModel.Data.splice(itemPosition, 1);
                $mdDialog.show(
                    $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Alert')
                    .textContent('Please select Number of Employees.')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('Got it!')
                    .targetEvent()
                );

            } else if (viewModel.appData.displayEmployee.length > viewModel.appData.noOfEmployees) {
                $('._md-select-menu-container ').removeClass('_md-active _md-clickable');
                $('._md-select-backdrop').css('z-index', '70');
                $mdDialog.show(
                    $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Alert')
                    .textContent('Maximum number of employees reached.')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('Got it!')
                    .targetEvent()
                );
                viewModel.Data = viewModel.appData.displayEmployee;
                var itemPosition = viewModel.Data.lastIndexOf(_.last(viewModel.Data));
                viewModel.Data = viewModel.Data.splice(itemPosition, 1);
            } else {
                viewModel.storeEmployees = [];
                angular.forEach(viewModel.activeEmployees, function(item) {
                    angular.forEach(viewModel.appData.displayEmployee, function(employee) {
                        if (item._id == employee) {
                            viewModel.storeEmployees.push({
                                'employeeID': item._id,
                                'employeeName': item.firstName + ' ' + item.lastName
                            });
                        }
                    });
                });
            }
        }

        viewModel.changeEmpDisplayValues = function() {
            viewModel.appData.displayEmployee = [];
        }

        function validTimeCheck(sTime, eTime, format) {

            var sTime = moment(sTime, format);
            var eTime = moment(eTime, format);

            var diftime = eTime.diff(sTime);
            if (diftime < 0)
                return false;
            else
                return true;
        }

        viewModel.validateDate = function(html, flag) {
            var dateflag;
            var startdate = moment(viewModel.appData.effectiveFrom);
            var enddate = moment(viewModel.appData.effectiveTo);
            if (enddate < startdate && flag == 2) {
                viewModel.eDerrorMessages = [{ type: "dateDynamicmessage", text: "End date must me greater than Start date" }];
                html.$setValidity('dateDynamicmessage', false);
                dateflag = true;
            }
            if (startdate > enddate && flag == 1) {
                viewModel.eDerrorMessages = [{ type: "dateDynamicmessage", text: "Start date must me less than End date" }];
                html.$setValidity('dateDynamicmessage', false);
                dateflag = true;
            }
            if (!dateflag)
                html.$setValidity('dateDynamicmessage', true);
        }

        viewModel.validateTime = function(control) {
            var eTflag;
            var bSflag;
            var bEflag;
            //var timeFormat = viewModel.appData.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
            var timeFormat = 'HH:mm';
            if (viewModel.appData.timeFormat == '12') {
                var startTime = viewModel.appData.startTime1 + ' ' + viewModel.appData.startampm.toLowerCase();
                startTime = moment(startTime, ["h:mm A"]).format("HH:mm");
                var endTime = viewModel.appData.endTime1 + ' ' + viewModel.appData.endampm.toLowerCase();
                endTime = moment(endTime, ["h:mm A"]).format("HH:mm");
                var breakStartTime = viewModel.appData.breakStartTime1 + ' ' + viewModel.appData.breakstartampm.toLowerCase();
                breakStartTime = moment(breakStartTime, ["h:mm A"]).format("HH:mm");
                var breakEndTime = viewModel.appData.breakEndTime1 + ' ' + viewModel.appData.breakendampm.toLowerCase();
                breakEndTime = moment(breakEndTime, ["h:mm A"]).format("HH:mm");
            } else {
                var startTime = viewModel.appData.startTime1;
                var endTime = viewModel.appData.endTime1;
                var breakStartTime = viewModel.appData.breakStartTime1;
                var breakEndTime = viewModel.appData.breakEndTime1;
            }

            if (!validTimeCheck(startTime, endTime, timeFormat)) {
                viewModel.eTeerrorMessages = [{ type: "eTdynamicmessage", text: "End time must me greater than Start time" }];
                control.$setValidity('eTdynamicmessage', false);
                eTflag = true;
            }
            if (!validTimeCheck(breakStartTime, endTime, timeFormat)) {
                viewModel.bSerrorMessages = [{ type: "bSdynamicmessage", text: "Break start time must be less than End time" }];
                control.$setValidity('bSdynamicmessage', false);
                bSflag = true;
            }

            if (!validTimeCheck(startTime, breakStartTime, timeFormat)) {
                viewModel.bSerrorMessages = [{ type: "bSdynamicmessage", text: "Break start time must be greater than Start time" }];
                control.$setValidity('bSdynamicmessage', false);
                bSflag = true;
            }

            if (!validTimeCheck(breakStartTime, breakEndTime, timeFormat)) {
                viewModel.bEerrorMessages = [{ type: "bEdynamicmessage", text: "Break end time must be greater than Break start time" }];
                control.$setValidity('bEdynamicmessage', false);
                bEflag = true;
            }

            if (!validTimeCheck(breakEndTime, endTime, timeFormat)) {
                viewModel.bEerrorMessages = [{ type: "bEdynamicmessage", text: "Break end time must be less than End" }];
                control.$setValidity('bEdynamicmessage', false);
                bEflag = true;
            }

            if (!eTflag)
                control.$setValidity('eTdynamicmessage', true);

            if (!bSflag)
                control.$setValidity('bSdynamicmessage', true);

            if (!bEflag)
                control.$setValidity('bEdynamicmessage', true);
        }
        viewModel.kBfiles = [];
        viewModel.knowledgeBaseFileChange = function() {
            viewModel.kBfiles = viewModel.kBfiles.concat(viewModel.appData.files);
            viewModel.appData.files = viewModel.kBfiles;
        }

        viewModel.deletedLoadedKBFiles = function(item) {

            for (i = 0; i < viewModel.appData.files.length; i++) {
                var loopItem = viewModel.appData.files[i].name + viewModel.appData.files[i].lastModified;
                console.log(loopItem)
                if (item == loopItem) {
                    var deleteItem = viewModel.appData.files.indexOf(viewModel.appData.files[i]);
                    if (deleteItem > -1) {
                        viewModel.appData.files.splice(deleteItem, 1);
                    }
                    break;
                }
            }

            console.log(viewModel.appData.files)
        }

        viewModel.defineAppointment = function() {

            var timeFormat = viewModel.appData.timeFormat == '12' ? 'hh:mm a' : 'HH:mm';
            if (viewModel.appData.files && viewModel.appData.files.length) {
                for (var i = 0; i < viewModel.appData.files.length; i++) {
                    var file = viewModel.appData.files[i];
                    if (!file.$error) {
                        Upload.upload({
                            url: 'api/serviceprovider/knowledgebaseuploads',
                            data: {
                                appointmentId: viewModel.appData.appointmentID,
                                userid: viewModel.serviceProviderId,
                                file: file
                            }
                        }).then(function(resp) {}, null, function(evt) {

                        });
                    }
                }
            }
            viewModel.appData.questions = [];
            for (var i = 0; i < viewModel.questions.length; i++) {
                flag = i == 0 ? true : (viewModel.required[i] == undefined ? false : viewModel.required[i]);
                var found = $.inArray(i, viewModel.remove) > -1;
                if (!found) {
                    viewModel.appData.questions.push({
                        'id': i,
                        'question': viewModel.questions[i] ? viewModel.questions[i] : null,
                        'required': flag
                    });
                }
            }
            if (viewModel.appData.timeFormat == '12') {
                viewModel.appData.startTime = viewModel.appData.startTime1 + ' ' + viewModel.appData.startampm.toLowerCase();
                viewModel.appData.endTime = viewModel.appData.endTime1 + ' ' + viewModel.appData.endampm.toLowerCase();
                viewModel.appData.breakStartTime = viewModel.appData.breakStartTime1 + ' ' + viewModel.appData.breakstartampm.toLowerCase();
                viewModel.appData.breakEndTime = viewModel.appData.breakEndTime1 + ' ' + viewModel.appData.breakendampm.toLowerCase();
            } else {
                viewModel.appData.startTime = viewModel.appData.startTime1;
                viewModel.appData.endTime = viewModel.appData.endTime1;
                viewModel.appData.breakStartTime = viewModel.appData.breakStartTime1;
                viewModel.appData.breakEndTime = viewModel.appData.breakEndTime1;
            }

            flag = true;
            if (!validTimeCheck(viewModel.appData.startTime, viewModel.appData.endTime, timeFormat)) flag = false;
            if (!validTimeCheck(viewModel.appData.breakEndTime, viewModel.appData.endTime, timeFormat)) flag = false;
            if (!validTimeCheck(viewModel.appData.startTime, viewModel.appData.breakStartTime, timeFormat)) flag = false;
            if (!validTimeCheck(viewModel.appData.breakStartTime, viewModel.appData.breakEndTime, timeFormat)) flag = false;
            if (!validTimeCheck(viewModel.appData.breakStartTime, viewModel.appData.endTime, timeFormat)) flag = false;

            if (!flag) {
                toaster.pop('info', "Not valid", "Please enter valid Times");
                return;
            }
            if (viewModel.storeEmployees == undefined) {
                viewModel.storeEmployees = []
            }
            if (viewModel.toEdit != true) {

                viewModel.appData.tempdisplayEmployee = viewModel.appData.displayEmployee;
                viewModel.appData.displayEmployee = viewModel.storeEmployees;
                viewModel.appData.serviceProviderId = viewModel.serviceProviderId;
                viewModel.appData.effectiveFrom = moment(viewModel.appData.effectiveFrom).format('YYYY-MM-DD');
                viewModel.appData.effectiveTo = moment(viewModel.appData.effectiveTo).format('YYYY-MM-DD');

                spAppService.saveAppointDefinition(viewModel.appData).then(function(data) {
                    if (data.success != false) {

                        viewModel.appData.displayEmployee = viewModel.appData.tempdisplayEmployee;
                        viewModel.storeEmployees = [];
                        // viewModel.message = data.message;
                        toaster.pop('success', "Success", data.message);
                        $location.path('/serviceprovider/appointmentDefinition');
                    }
                }, function(error) {
                    console.log(error.statusText);
                });
            } else {
                viewModel.appData.tempdisplayEmployee = viewModel.appData.displayEmployee;
                viewModel.appData.displayEmployee = viewModel.storeEmployees;
                viewModel.appData.serviceProviderId = viewModel.serviceProviderId;
                viewModel.appData.effectiveFrom = moment(viewModel.appData.effectiveFrom).format('YYYY-MM-DD');
                viewModel.appData.effectiveTo = moment(viewModel.appData.effectiveTo).format('YYYY-MM-DD');
                spAppService.updateAppointDefinition(viewModel.appData, viewModel.appointmentId).then(function(data) {
                    if (data.success != false) {

                        viewModel.appData.displayEmployee = viewModel.appData.tempdisplayEmployee;
                        // viewModel.storeEmployees =[];
                        //  viewModel.message = data.message;
                        toaster.pop('success', "Success", data.message);
                        $location.path('/serviceprovider/appointmentDefinition');
                    }
                }, function(error) {
                    console.log(error.statusText);
                });
            }
        }

        viewModel.toggle = function(flag, html) {
            if (flag == 1) {
                viewModel.appData.startampm = viewModel.appData.startampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html);
            }
            if (flag == 2) {
                viewModel.appData.endampm = viewModel.appData.endampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html);
            }
            if (flag == 3) {
                viewModel.appData.breakstartampm = viewModel.appData.breakstartampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html)
            }
            if (flag == 4) {
                viewModel.appData.breakendampm = viewModel.appData.breakendampm == 'AM' ? 'PM' : 'AM';
                viewModel.validateTime(html)
            }
        }

        viewModel.viewUploadedknowlwdgebase = function() {
            spAppService.getUploadedKnowledgebase(viewModel.appointmentID, viewModel.serviceProviderId).then(function(data) {
                if (data.success != false) {
                    viewModel.uploadContents = data;
                    uploadDataMagPopup();
                }
            }, function(error) {
                console.log(error.statusText);
            });
        }

        var uploadDataMagPopup = function() {

            //if( $('.upload-data-content-over-wrapper').find( "a" ).length ) {
            $('.upload-data-content-over-wrapper').magnificPopup({
                delegate: 'a',
                type: 'image',
                closeOnContentClick: true,
                closeBtnInside: false,
                fixedContentPos: true,
                gallery: {
                    enabled: false
                },
                zoom: {
                    enabled: true,
                    duration: 300,
                    easing: 'ease-in-out',
                    opener: function(openerElement) {
                        return openerElement.is('div') ? openerElement : openerElement.find('div');
                    }
                }
            });

        }

        viewModel.deletUploadedFile = function(conent_id) {
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this?')
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                spAppService.deleteKnowledgebase(conent_id, viewModel.serviceProviderId)
                    .then(function(data) {
                        viewModel.viewUploadedknowlwdgebase();
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });
        }


        $(document).on("click", ".pdf-file", function() {
            var path = $(this).children('a').data('link');
            $.magnificPopup.open({
                items: {
                    src: path
                },
                type: 'iframe'
            });
        });

        viewModel.addRequirement = function() {
            value = 1 + value;
            viewModel.indexValues.push(value);
        }

        viewModel.to_trusted = function(html_code) {
            return $sce.trustAsHtml(html_code);
        }
        viewModel.nextTab = function() {
            viewModel.selectedTab = 1
        }

        viewModel.removeRequirement = function(data) {

            //value =  value - 1;  
            var index = viewModel.indexValues.indexOf(data);
            if (index > -1) {
                viewModel.indexValues.splice(index, 1);
                viewModel.remove.push(data - 1);
            }
        }

    }).controller('appointmentDefinitionListController', function(spAppService, Auth, Upload, $mdDialog, toaster) {
        var viewModel = this;
        viewModel.serviceprovider = {};
        viewModel.appointments = {};
        viewModel.appointments = {
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 2,
            paginationPageSizes: [10, 25, 50, 75],
            paginationPageSize: 10,
            columnDefs: [{
                name: 'id',
                visible: false
            }, {
                name: 'Appointment Name'
            }, {
                name: 'Appointment Type'
            }, {
                name: 'Status'
            }, {
                name: 'Effective From',
                type: 'date',
                cellFilter: 'date:\'MM/dd/yyyy\''
            }, {
                name: 'Effective To',
                type: 'date',
                cellFilter: 'date:\'MM/dd/yyyy\''
            }, {
                name: 'Action',
                cellTemplate: '<div class="col-lg-12"  layout="row"  layout-align="center center"><a ng-href="/serviceprovider/appointmentDefinition/{{row.entity.id}}"  style="margin-top: 5px;"  class="btn btn-sm btn-info">Edit</a><a ng-href="/serviceprovider/appointmentDefinition/{{row.entity.id}}/{{row.entity.appointmentId}}"  style="margin-top: 5px;margin-left: 5px;"  class="btn btn-sm btn-info">Copy</a><button type="button" style="margin-left: 5px;margin-top:5px;" ng-click="grid.appScope.sp.showConfirm(row.entity.id)" class="btn btn-sm btn-danger">Delete</button></div>',
                width: '190',
                enableSorting: false
            }],

            rowHeight: 50,
        };
        Auth.getUser().success(function(user) {
            viewModel.serviceprovider = user;
            viewModel.DisplayAppointmentList();
        });
        viewModel.DisplayAppointmentList = function() {
            spAppService.appointmentList(viewModel.serviceprovider.id)
                .then(function(data) {
                    viewModel.processing = false;
                    displayAppointmentList(data);
                }, function(error) {
                    console.log(error.statusText);
                });
        }
        viewModel.showConfirm = function(id) {
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this Appointment?')
                //.textContent('All of the banks have agreed to forgive you your debts.')
                .ariaLabel('Lucky day')
                .targetEvent(id)
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                spAppService.deleteAppointment(id, viewModel.serviceprovider.id)
                    .then(function(data) {

                        viewModel.DisplayAppointmentList();
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });
        };


        viewModel.searchAppointment = function() {
            spAppService.gridViewSearch('appointmentList', viewModel.appointmentSearchBox)
                .then(function(data) {
                    if (data.success)
                        displayAppointmentList(data.entity);
                    else
                        toaster.pop('Nothing found!', "", "Sorry no Appointments found!");

                }, function(error) {
                    console.log(error.statusText);
                });
        }

        function displayAppointmentList(data) {
            viewModel.appointments.data = [];
            angular.forEach(data, function(item) {
                viewModel.appointments.data.push({
                    "id": item._id,
                    "Appointment Name": item.appointmentName,
                    "Appointment Type": item.appointmentType,
                    "Status": item.status,
                    "Effective From": item.effectiveFrom,
                    "Effective To": item.effectiveTo,
                    "appointmentId": item.appointmentId
                });
            });
        }

        viewModel.getAppointmentList = function() {
            if (!viewModel.appointmentSearchBox) {
                spAppService.appointmentList(viewModel.serviceprovider.id)
                    .then(function(data) {
                        viewModel.processing = false;
                        displayAppointmentList(data);
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }
        }

    })

.controller('serviceProviderApproval', function(spAppService, Auth, Upload, lookupAppService, empAppService, toaster, $mdDialog) {

    var viewModel = this;
    viewModel.serviceProviders = {};
    Auth.getUser().success(function(data) {
        viewModel.user = data;
        if (viewModel.user.corporateLogin) {
            viewModel.serviceProviders = {
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: 2,
                paginationPageSizes: [10, 25, 50, 75],
                paginationPageSize: 10,
                columnDefs: [{
                    name: 'id',
                    visible: false
                }, {
                    name: 'Name'
                }, {
                    name: 'User Name'
                }, {
                    name: 'Company Name'
                }, {
                    name: 'Phone'
                }, {
                    name: 'Email'
                }, {
                    name: 'Country'
                }, {
                    name: 'Zip Code'
                }, {
                    name: 'Status'
                }, {
                    name: 'Action',
                    cellTemplate: '<div class="col-lg-12" layout="row"><button type="button" style="margin-top: 5px;" ng-click="grid.appScope.sp.serviceProviderApproveAction(row.entity.id, ' + "1" + ')" class="btn btn-sm btn-success">Approve</button><button type="button" style="margin-left: 5px;margin-top:5px;" ng-click="grid.appScope.sp.serviceProviderApproveAction(row.entity.id, ' + "0" + ')" ng-hide="row.entity.hideRejectButton" class="btn btn-sm btn-danger">Reject</button></div>',
                    width: '130',
                    enableSorting: false
                }],

                rowHeight: 50,
            };
            viewModel.processing = true;


            viewModel.displayServiceProviders = function() {

                spAppService.unApprovedSpList().then(function(data) {
                    viewModel.processing = false;
                    viewModel.serviceProviders.data = [];
                    angular.forEach(data, function(item) {
                        viewModel.serviceProviders.data.push({
                            "id": item._id,
                            "Name": item.firstName + " " + item.lastName,
                            "User Name": item.userName,
                            "Company Name": item.companyName,
                            "Phone": item.areaCode + " " + item.mobilePhone,
                            "Email": item.email,
                            "Country": item.country,
                            "Zip Code": item.zipCode,
                            "Status": item.approved,
                            "hideRejectButton": item.approved == "Rejected" ? true : false
                        });
                    });
                }, function(error) {
                    console.log(error.statusText);
                });

            }

            viewModel.displayServiceProviders();

            viewModel.serviceProviderApproveAction = function(id, type) {
                var dialogMessage = type == 1 ? 'Approve' : 'Reject';
                if (type == 1) {
                    var confirm = $mdDialog.confirm()
                        .title('Would you like to ' + dialogMessage + ' this Service Provider?')
                        .ariaLabel('Lucky day')
                        .targetEvent(id)
                        .ok(dialogMessage)
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        spAppService.updateSpApprove(id, type).then(function(data) {
                            viewModel.displayServiceProviders();
                        });

                    }, function() {

                    });
                } else {
                    var confirm = $mdDialog.prompt()
                        .title('Would you like to ' + dialogMessage + ' this Service Provider?')
                        .textContent('Why do you reject this service provider?')
                        .placeholder('Reason')
                        .ariaLabel('Dog name')
                        .targetEvent(id)
                        .ok(dialogMessage)
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function(result) {
                        spAppService.updateSpApprove(id, type, result).then(function(data) {
                            viewModel.displayServiceProviders();
                        });
                    }, function() {

                    });
                }


            }


        } else {
            viewModel.message = 'You have no permission to access this page';
        }
    })
}).controller('spAppointmentReviewController', function(spAppService, cAppService, Auth, $mdDialog) {

    viewModel = this;
    Auth.getUser().success(function(data) {
        viewModel.user = data;
        appointmentsList(viewModel.user.id);
    });

    viewModel.getAppointmentDetails = function(item) {
        viewModel.selectedItem = item;
        viewModel.appontmentItem = item;

        cAppService.get(item.customerID).then(function(data) {
            viewModel.selectedItem.firstName = data.firstName;
            viewModel.selectedItem.lastName = data.LastName;
            viewModel.selectedItem.mobilePhone = data.mobilePhone;
            viewModel.selectedItem.country = data.country;
            viewModel.selectedItem.areaCode = data.areaCode;
            viewModel.selectedItem.email = data.email;
            viewModel.selectedItem.userName = data.userName;
            viewModel.selectedItem.profilePicUrl = data.profilePicUrl;

            viewModel.selectedItem.profilePicUrl = data.profilePicUrl ? '/uploads/profilepics/' + data.profilePicUrl : 'assets/img/default.jpg';

        })
    }

    viewModel.appointmentCheckFormAction = function(action) {
        var update = '';
        var dialogMessage = action == true ? 'Approve' : 'Reject';

        update = action == true ? 'Confirmed' : 'Rejected';

        var confirm = $mdDialog.confirm()
            .title('Would you like to ' + dialogMessage + ' this Appointment?')
            .ariaLabel('Lucky day')
            .ok(dialogMessage)
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function() {
            cAppService.appointmentSheduleCheck(viewModel.appontmentItem._id, update).then(function(data) {
                appointmentsList(viewModel.user.id);
                viewModel.changeSelectItem = false;
                viewModel.selectedItem = [];
                viewModel.appontmentItem = null;
                viewModel.appointmentList = [];
                appointmentsList(viewModel.user.id);
            });
        }, function() {});
    }

    function appointmentsList(id) {

        cAppService.getAppointmentDetails(viewModel.user.id).then(function(data) {
            viewModel.appointmentList = data;
            viewModel.selectedItem = [];
            viewModel.appontmentItem = [];
        });
    }
}).controller('serviceProviderAppointmentsReport', function(spAppService, $filter, cAppService, Auth, $mdDialog, toaster) {

    var viewModel = this;

    viewModel.processing = false;
    viewModel.appointmentList = {};
    viewModel.appointmentList = {
        enableHorizontalScrollbar: 0,
        enableVerticalScrollbar: 2,
        paginationPageSizes: [10, 25, 50, 75],
        paginationPageSize: 10,
        headerTooltip: true,
        columnDefs: [{
            name: 'id',
            visible: false
        }, {
            name: 'AppointmentName',
            width: '15%',
            headerTooltip: 'Appointment Name',
            cellTooltip: function (row) {
                return 'Name: ' + row.entity.AppointmentName;
            }         
        }, {
            name: 'Date & Time',
            width: '15%',
            headerTooltip: 'Date & Time'
        }, {
            name: 'Type',
            width: '5%',
            headerTooltip: 'Type',
            cellTooltip:function(row){
                return 'Type: '+row.entity.Type;
            }
        }, {
            name: 'Customer',
            headerTooltip: 'Customer',
            cellTooltip: function (row) {
                return 'Name: ' + row.entity.Customer;
            }
        }, {
            name: 'Confirmation Number',
            width: '15%',
            headerTooltip: 'Confirmation Number'
        }, {
            name: 'Contact Number',
            headerTooltip: 'Contact Number'
        }, {
            name: 'EmployeeName',
            headerTooltip: 'Employee Name',
            cellTooltip: function (row) {
                return 'Name: ' + row.entity.EmployeeName;
            }
        }, {
            name: 'Status',
            headerTooltip: 'Status',
            cellTooltip: function (row) {
                return 'Status: ' + row.entity.Status;
            }
        }, {
            name: 'View',
            cellTemplate: '<div class="col-lg-12 p-l-0" layout="row" layout-align="center center"><i class="fa fa-eye" aria-hidden="true" ng-click="grid.appScope.sp.viewAppointmentDetails(event, row.entity.id)"><md-tooltip md-direction="top">View Details</md-tooltip></i></div>',
            enableSorting: false,
            width:'6%'
        }],

        rowHeight: 50,
    };

    viewModel.viewAppointmentDetails = function(event, id) {
        viewModel.selectedId = id;
        $mdDialog.show({
            templateUrl: 'app/views/pages/sp/appointmentReportDetailView.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: event,
            controller: DialogController,
            clickOutsideToClose: true,
            fullscreen: true
        });
    }

    function DialogController($scope, $mdDialog) {
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        for (i = 0; i < viewModel.appointmentList.length; i++) {
            if (viewModel.appointmentList[i]._id == viewModel.selectedId) {
                $scope.appointmentReportItem = viewModel.appointmentList[i];
                break;
            }
        }

    };

    Auth.getUser().success(function(data) {
        viewModel.user = data;



        spAppService.appointmentList(viewModel.user.id)
            .then(function(data) {

                viewModel.appointments = data;

                if(viewModel.user.type == 'Employees') {
                    viewModel.empId = viewModel.user.id;
                    viewModel.date = moment(new Date()).format('YYYY-MM-DD');
                    viewModel.appointmentId = _.pluck(data, '_id');
                    appointmentListing();
                } else{
                    viewModel.date = moment(new Date()).format('YYYY-MM-DD');
                }  

            }, function(error) {
                console.log(error.statusText);
            });

        viewModel.searchAppointments = function() {

            if(viewModel.user.type == 'Employees') {
                viewModel.empId = viewModel.user.id;
            }

            viewModel.appointmentId = viewModel.appointment;

            if ((!viewModel.fromDate || !viewModel.toDate) && !viewModel.appointmentId) {
                toaster.pop('info', "Please Select Appointment Dates or Appointment");
                return
            }

            if (viewModel.fromDate && viewModel.toDate) {
                viewModel.fromDate = moment(viewModel.fromDate).format('YYYY-MM-DD');
                viewModel.toDate = moment(viewModel.toDate).format('YYYY-MM-DD');
            }

            appointmentListing();
        }

        function appointmentListing() {

            var obj = {
                id: viewModel.user.id,
                from: viewModel.fromDate,
                to: viewModel.toDate,
                appointmentId: viewModel.appointmentId,
                empId: viewModel.empId,
                date: viewModel.date
            }

            spAppService.appointmentSheduleReport(obj).then(function(data) {
                if (data.success) {
                    viewModel.appointmentList = data.entity;
                    viewModel.appointmentList.data = [];
                    angular.forEach(data.entity, function(item) {
                        viewModel.appointmentList.data.push({
                            "id": item._id,
                            "AppointmentName": item.appointmentName,
                            "Date & Time": moment(item.appointmentDate).format('MM/DD/YYYY') + ' ' + item.appointmentTime,
                            "Type": item.spot ? "Spot" : "Regular",
                            "Customer": item.customerName,
                            "Confirmation Number": item.appRefNo,
                            "Contact Number": item.customerMobile,
                            "EmployeeName": item.employeeName,
                            "Status": item.status
                        });
                    });
                } else {
                    toaster.pop('info', data.message);
                    viewModel.appointmentList.data = [];
                }
            });
        }
    });


});

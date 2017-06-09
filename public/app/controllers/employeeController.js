angular.module('empCtrl', ['serviceProviderService', 'textAngular'])
    .controller('employeeController', function(empAppService, Auth, $mdDialog, spAppService, toaster) {

        var viewModel = this;

        viewModel.DisplayEmployee = {};
        viewModel.DisplayEmployee = {
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
                name: 'UserName'
            }, {
                name: 'Status'
            }, {
                name: 'Designation'
            }, {
                name: 'Role'
            }, {
                name: 'Action',
                cellTemplate: '<div class="col-lg-12" layout="row" layout-align="center center"><a ng-href="/employee/{{row.entity.id}}" style="margin-top:5px;" class="btn btn-sm btn-info">Edit</a><button type="button" style="margin-left: 5px;margin-top:5px;" ng-click="grid.appScope.e.showConfirm(row.entity.id)" class="btn btn-sm btn-danger">Delete</button></div>',
                width: '170',
                enableSorting: false

            }],

            rowHeight: 50,
        };

        var serviceprovider = {};

        viewModel.isProcessing = true;

        Auth.getUser().success(function(data) {
            serviceprovider = data;

            empAppService.all(serviceprovider.id)
                .then(function(data) {
                    viewModel.processing = false;
                    viewModel.employees = data;
                    displayEmployees(data);
                }, function(error) {
                    console.log(error.statusText);
                });
        });

        viewModel.showConfirm = function(id) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this Employee?')
                //.textContent('All of the banks have agreed to forgive you your debts.')
                .ariaLabel('Lucky day')
                .targetEvent(id)
                .ok('Please do it!')
                .cancel('Sounds like a scam');
            $mdDialog.show(confirm).then(function() {
                empAppService.deleteemployee(id, serviceprovider.id)
                    .then(function(data) {
                        empAppService.all(serviceprovider.id)
                            .then(function(data) {
                                viewModel.processing = false;
                                viewModel.employees = data;
                                viewModel.DisplayEmployee.data = [];
                                angular.forEach(data, function(item) {
                                    viewModel.DisplayEmployee.data.push({
                                        "id": item._id,
                                        "UserName": item.userName,
                                        "Status": item.status,
                                        "Designation": item.designation,
                                        "Role": item.role
                                    });
                                });
                            }, function(error) {
                                console.log(error.statusText);
                            });
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });
        };

        viewModel.searchEmployee = function() {
            if (viewModel.employeeSearchValue) {
                spAppService.gridViewSearch('employee', viewModel.employeeSearchValue)
                    .then(function(data) {
                        if (data.success)
                            displayEmployees(data.entity);
                        else
                            toaster.pop('Nothing found!', "", "Sorry no employees found!");

                    }, function(error) {
                        console.log(error.statusText);
                    });
            }
        }

        viewModel.getEmployeeList = function() {
            if (viewModel.employeeSearchValue == '') {
                empAppService.all(serviceprovider.id)
                    .then(function(data) {
                        viewModel.processing = false;
                        viewModel.employees = data;
                        displayEmployees(data);
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }
        }

        function displayEmployees(data) {
            viewModel.DisplayEmployee.data = [];
            angular.forEach(data, function(item) {
                viewModel.DisplayEmployee.data.push({
                    "id": item._id,
                    "Name": item.firstName + ' ' + item.lastName,
                    "UserName": item.userName,
                    "Status": item.status,
                    "Designation": item.designation,
                    "Role": item.role
                });
            });
        }

    })
    .controller('employeeCreateController', function(empAppService, lookupAppService, $location, Auth) {

        var viewModel = this;

        viewModel.eData = {};
        viewModel.status = ['Pending', 'Active', 'Inactive'];
        viewModel.eData.status = viewModel.status[1];

        Auth.getUser().success(function(user) {

            serviceProvider = user;

            lookupAppService.get(user.id, "Role").then(function(role) {
                viewModel.roles = _.pluck(role, 'value');
                viewModel.eData.role = viewModel.roles[0];
            }, function(error) {
                console.log(error.statusText);
            });

        });

        viewModel.type = 'create';

        var serviceprovider = {};

        Auth.getUser().success(function(data) {
            serviceprovider = data;
        });

        viewModel.eData.effectiveFrom = new Date();
        viewModel.eData.effectiveTo = new Date();

        // var resettingData = Object.assign({}, viewModel.eData);
        var resettingData = JSON.parse(JSON.stringify(viewModel.eData));


        viewModel.saveEmployee = function() {
            viewModel.processing = true;
            viewModel.message = '';

            if (viewModel.eData.confirmPassword != viewModel.eData.password)
                return;

            empAppService.create(viewModel.eData, serviceprovider.id)
                .then(function(data) {
                    if (data.success != false) {
                        viewModel.processing = false;
                        $location.path('/employee');
                    }
                    viewModel.message = data.message;
                }, function(error) {
                    console.log(error.statusText);
                });
        };

        var resetForm = function() {
            viewModel.eData = resettingData;
            viewModel.employeeForm.$setUntouched();
            viewModel.confirmPassword = "";
        }

        viewModel.cancel = function() {
            resetForm();
        }
    })
    .controller('employeeUpdateController', function(empAppService, lookupAppService, $location, $routeParams, Auth) {

        var viewModel = this;

        viewModel.status = ['Pending', 'Active', 'Inactive'];
        // viewModel.roles = ['Administarator', 'Manager', 'System Analyst'];

        viewModel.eData = {};
        viewModel.eData.effectiveFrom = new Date();
        viewModel.eData.effectiveTo = new Date();

        viewModel.type = 'edit';

        var serviceprovider = {};

        Auth.getUser().success(function(data) {

            serviceprovider = data;
            empAppService.get($routeParams.id, data.id)
                .then(function(data) {
                    viewModel.eData = data;
                    viewModel.eData.status = data.status;
                    viewModel.eData.role = data.role;

                    viewModel.eData.effectiveFrom = new Date(data.effectiveFrom);
                    viewModel.eData.effectiveTo = new Date(data.effectiveTo);
                }, function(error) {
                    console.log(error.statusText);
                });

            lookupAppService.get(serviceprovider.id, "Role").then(function(role) {
                viewModel.roles = _.pluck(role, 'value');
            }, function(error) {
                console.log(error.statusText);
            });
        });

        viewModel.saveEmployee = function() {

            viewModel.eData.serviceProviderId = serviceprovider.id;

            empAppService.update($routeParams.id, viewModel.eData)
                .then(function(data) {
                    if (data.success) {
                        $location.path('/employee');
                    }
                }, function(error) {
                    console.log(error.statusText);
                });
        };



    }).controller('employeeHomeController', function(empAppService, Auth) {

    }).controller('employeeClosingController', function(empAppService, Auth, Upload, toaster) {

        var viewModel = this;
        viewModel.closingData = {};
        viewModel.comments = [];
        Auth.getUser().success(function(data) {
            viewModel.employee = data;
            empAppService.loadReferenceNumbers(data.id, new Date())
                .then(function(data) {
                    viewModel.spotAppointments = data.spot;
                    viewModel.regularAppointments = data.regular;
                }, function(error) {
                    console.log(error.statusText);
                });

            empAppService.spDetails(data.id)
                .then(function(sp) {
                    viewModel.serviceProvider = sp;
                }, function(error) {
                    console.log(error.statusText);
                });

            viewModel.saveClosing = function() {
                
                viewModel.disable = true;
                if (viewModel.closingData.files && viewModel.closingData.files.length) {

                    Upload.upload({
                        url: 'api/serviceprovider/closingAttachmentUploads',
                        data: {
                            empId: viewModel.employee.id,
                            appointmentId: viewModel.selectedAppointment,
                            file: viewModel.closingData.files
                        }
                    }).then(function(resp) {
                        console.log(resp)
                        viewModel.fnClosing();
                    }, null, function(evt) {

                    });
                } else {
                    viewModel.fnClosing();
                }
            }

            viewModel.fnClosing = function() {
                viewModel.closingData.employeeId = viewModel.employee.id;
                viewModel.closingData.appointmentId = viewModel.selectedAppointment;
                
                empAppService.saveClosing(viewModel.closingData)
                    .then(function(data) {
                        console.log(data)
                        if (data.success) {

                            viewModel.disable = false;
                            viewModel.closingData = {};
                            viewModel.customer = [];
                            toaster.pop('success', "Success", data.message);
                            viewModel.regularAppointments = [];
                            viewModel.spotAppointments = [];
                            viewModel.closingData = {};
                            viewModel.kBfiles = [];

                            viewModel.closing.spotAppointment = null;
                            viewModel.closing.regularAppointment = null;

                            empAppService.loadReferenceNumbers(viewModel.employee.id, new Date())
                                .then(function(data) {
                                    viewModel.spotAppointments = data.spot;
                                    viewModel.regularAppointments = data.regular;
                                }, function(error) {
                                    console.log(error.statusText);
                                });
                        } else {
                          toaster.pop('error', "Error occured", data.message);  
                        }
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }
        });

        viewModel.getCustomerDetails = function(appointmentId, customerId) {
            viewModel.customer = [];
            viewModel.selectedAppointment = appointmentId;
            empAppService.getCustomerDetails(customerId)
                .then(function(data) {
                    viewModel.customer = data;
                }, function(error) {
                    console.log(error.statusText);
                });
        }

        viewModel.kBfiles = [];
        viewModel.attachmentFileChange = function() {
            viewModel.kBfiles = viewModel.kBfiles.concat(viewModel.closingData.files);
            viewModel.closingData.files = viewModel.kBfiles;
        }

        viewModel.deletedLoadedKBFiles = function(item) {

            for (i = 0; i < viewModel.closingData.files.length; i++) {
                var loopItem = viewModel.closingData.files[i].name + viewModel.closingData.files[i].lastModified;
                console.log(loopItem)
                if (item == loopItem) {
                    var deleteItem = viewModel.closingData.files.indexOf(viewModel.closingData.files[i]);
                    if (deleteItem > -1) {
                        viewModel.closingData.files.splice(deleteItem, 1);
                    }
                    break;
                }
            }

            console.log(viewModel.closingData.files)
        }

        viewModel.addComment = function() {
            if( !viewModel.closingData.comments.length ) return;

            var comment = viewModel.closingData.comments;
            viewModel.comments.push(viewModel.closingData.comments.length);
            viewModel.closingData.comments = null;
        }   
    });

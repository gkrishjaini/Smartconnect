angular.module('smartConnectionRoutes', ['ngRoute'])
    .config(function ($routeProvider, $locationProvider) {

        $routeProvider.when('/', {
            templateUrl: '/app/views/pages/login.html',
            controller: 'mainController',
            controllerAs: 'login'
        })

            .when('/forgotpassword', {
                templateUrl: 'app/views/pages/forgotpassword.html',
                controller: 'mainController',
                controllerAs: 'fp'
            })
            .when('/changepassword/:code/:id', {
                templateUrl: 'app/views/pages/changepassword.html',
                controller: 'mainController',
                controllerAs: 'fp'
            })
            .when('/serviceprovider/success', {
                templateUrl: '/app/views/pages/sp/info.html',
                controller: 'mainController',
                controllerAs: 'm'
            })
            .when('/serviceprovider', {
                templateUrl: 'app/views/pages/sp/all.html',
                controller: 'serviceProviderController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/create', {
                templateUrl: 'app/views/pages/sp/create.html',
                controller: 'serviceProviderCreateController',
                controllerAs: 'sp'
            })
            .when('/verify/:code/:id',{
                templateUrl:'app/views/pages/sp/EmailVerfied.html',
                controller:'serviceProviderVerifyController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/home', {
                templateUrl: 'app/views/pages/sp/home.html',
                controller: 'serviceProviderHomeController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/profile', {
                templateUrl: 'app/views/pages/sp/profile.html',
                controller: 'serviceProviderProfileController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/appointmentDefinition/create', {
                templateUrl: 'app/views/pages/sp/appointmentDefinition.html',
                controller: 'serviceProviderAppointmentDefinitionController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/appointmentDefinition/:id/:flag', {
                templateUrl: 'app/views/pages/sp/appointmentDefinition.html',
                controller: 'serviceProviderAppointmentDefinitionController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/appointmentDefinition', {
                templateUrl: 'app/views/pages/sp/appointmentsList.html',
                controller: 'appointmentDefinitionListController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/appointmentDefinition/:id', {
                templateUrl: 'app/views/pages/sp/appointmentDefinition.html',
                controller: 'serviceProviderAppointmentDefinitionController',
                controllerAs: 'sp'
            })
                   
            .when('/serviceprovider/serviceProviderApproval',{
                templateUrl: 'app/views/pages/sp/serviceProviderApproval.html',
                controller: 'serviceProviderApproval',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/reviewAppointment',{
                templateUrl: 'app/views/pages/sp/reviewAppointment.html',
                controller: 'spAppointmentReviewController',
                controllerAs: 'sp'
            })
            .when('/serviceprovider/lookup', {
                templateUrl: 'app/views/pages/lookup/all.html',
                controller: 'lookupController',
                controllerAs: 'l'
            }).when('/serviceprovider/lookupTypeList', {
                templateUrl: 'app/views/pages/lookup/lookupTypeList.html',
                controller: 'lookupController',
                controllerAs: 'l'
            }).when('/appointmentsReport', {
                templateUrl: 'app/views/pages/sp/appointmentsReport.html',
                controller: 'serviceProviderAppointmentsReport',
                controllerAs: 'sp'
            })
            // .when('/serviceprovider/lookup/create', {
            //     templateUrl: 'app/views/pages/lookup/create.tmpl.html',
            //     controller: 'lookupController',
            //     controllerAs: 'l'
            // })
            .when('/customer', {
                templateUrl: 'app/views/pages/customer/all.html',
                controller: 'customerController',
                controllerAs: 'c'
            }).when('/customer/create', {
                templateUrl: 'app/views/pages/customer/create.html',
                controller: 'customerCreateController',
                controllerAs: 'c'
            }).when('/customer/home', {
                templateUrl: 'app/views/pages/customer/home.html',
                controller: 'customerHomeController',
                controllerAs: 'c'
            }).when('/customer/profile', {
                templateUrl: 'app/views/pages/customer/profile.html',
                controller: 'customerProfileController',
                controllerAs: 'c'
            }).when('/customer/success', {
                templateUrl: 'app/views/pages/customer/info.html',
                controller: 'customerProfileController',
                controllerAs: 'c'
            }).when('/scheduleAppointment', {
                templateUrl: 'app/views/pages/customer/appointmentSchedule.html',
                controller: 'customerAppointmentScheduleController',
                controllerAs: 'c'
            })
            .when('/employee', {
                templateUrl: 'app/views/pages/employee/all.html',
                controller: 'employeeController',
                controllerAs: 'e'
            })
            .when('/employee/create', {
                templateUrl: 'app/views/pages/employee/create.html',
                controller: 'employeeCreateController',
                controllerAs: 'e'
            })
            .when('/employee/home', {
                templateUrl: 'app/views/pages/sp/appointmentsReport.html',
                controller: 'serviceProviderAppointmentsReport',
                controllerAs: 'sp'
            })
            .when('/employee/closing', {
                templateUrl: 'app/views/pages/employee/closing.html',
                controller: 'employeeClosingController',
                controllerAs: 'e'
            })
            .when('/employee/:id', {
                templateUrl: 'app/views/pages/employee/create.html',
                controller: 'employeeUpdateController',
                controllerAs: 'e'
            })
            .when('/landing', {
                templateUrl: '/app/views/landing.html',
                controller: 'mainController',
                controllerAs: 'lp'
            })
            

        $locationProvider.html5Mode(true);
    });

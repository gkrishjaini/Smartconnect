angular.module('mainCtrl', [])
    .controller('mainController', function($rootScope, $location, Auth, AuthResetUserPass, landingPage, $route, UsernameValidation, $routeParams) {
        var viewmodel = this;
        viewmodel.passwordChange=true;
        viewmodel.loginData = {};
        
        viewmodel.loggedIn = Auth.isLoggedIn();

        $rootScope.$on('$routeChangeStart', function() {
            viewmodel.loggedIn = Auth.isLoggedIn();

            if (viewmodel.loggedIn && ($location.path() === '/' || $location.path() === '\\' || $location.path() === '/forgotpassword' || $location.path().substring(8,$location.path().indexOf("/"))==='/verify/')) {
                Auth.logout();
                viewmodel.loggedIn = false;
                viewmodel.user = {};
            }

            Auth.getUser().success(function(data) {
                viewmodel.user = data;
                viewmodel.user.profileImgUrl = data.profilePicUrl ? 'uploads/profilepics/'+ data.profilePicUrl : 'assets/img/default.jpg';
                if (data.type == 'ServiceProviders') {
                    viewmodel.profileUrl = '/serviceprovider/profile';

                } else if (data.type == 'Customers') {
                    viewmodel.profileUrl = '/customer/profile';

                } else {}
            })
        });

        viewmodel.reload = function() {
            $route.reload();
        }


        viewmodel.doLogin = function() {

            viewmodel.error = '';

            viewmodel.processing = true;
            viewmodel.loginData.device = false;
            Auth.login(viewmodel.loginData.userName, viewmodel.loginData.password ,viewmodel.loginData.device)
                .success(function(data) {

                    viewmodel.processing = false;

                    if (data.success) {
                        if (data.type == 'ServiceProviders' ) {
                            viewmodel.profileUrl = '/serviceprovider/profile';
                            $location.path('/serviceprovider/home');

                        } else if (data.type == 'Customers') {
                            viewmodel.profileUrl = '/customer/profile';
                            $location.path('/customer/home');

                        } 
                        else if (data.type == 'Employees') {
                            viewmodel.profileUrl = '/employee/home';
                            $location.path('/employee/home');

                        } 
                        else {
                            $location.path('/serviceprovider');
                        }

                    } else {
                        viewmodel.error = data.message;
                    }
                });
        };

        viewmodel.doLogout = function() {
            Auth.logout();
            viewmodel.loggedIn = false;
            viewmodel.user = {};
            $location.path('/');
        };

        viewmodel.showStageOne = true;
        viewmodel.showStageTwo = false;
        viewmodel.showStageThree = false;
        viewmodel.showStageFour = false;
        viewmodel.successMsg = false;
        viewmodel.showSecurityQuestions = false;
        viewmodel.checkUsername = function() {
                data = {
                    'phase': 'checkUsername',
                    'userName': viewmodel.checkUsername.userName
                };

                AuthResetUserPass.passwordResetSection(data).success(function(data) {

                    if (data.success) {
                        viewmodel.showStageOne = false;
                        viewmodel.showStageTwo = true;
                        viewmodel.showError = false;
                        if( data.securityQuestions == null || data.securityQuestions.length == 0 ) {
                            viewmodel.showError = false;
                            viewmodel.noSecurityQuestion = true;
                            viewmodel.error = 'No security Questions Found!';
                        } else {
                            viewmodel.noSecurityQuestion = false;
                            viewmodel.DisplayQuestionsValues = [];
                            angular.forEach(data.securityQuestions, function(value, key) {
                                viewmodel.DisplayQuestionsValues.push({
                                    "question": value.question
                                });
                            });
                            viewmodel.showSecurityQuestions = false;
                        }
                    } else {
                        viewmodel.showError = true;
                        viewmodel.error = data.message;
                    }
                });
            }
            viewmodel.checkVerification = function() {
                var value;
                // if (viewmodel.checkVerification.verificationOption == 'mobilePhone') {
                //     //value = viewmodel.checkVerification.mobilePhone;
                // }
                // if (viewmodel.checkVerification.verificationOption == 'email') {
                //    // value = viewmodel.checkVerification.email;
                // }
          
                data = {
                    'phase': 'checkVerification',
                    'userName': viewmodel.checkUsername.userName,
                    'type': viewmodel.loginData.type,
                    'method': viewmodel.checkVerification.verificationOption,
                    //'values': value
                };
                AuthResetUserPass.passwordResetSection(data).success(function(data) {
                    if (data.success) {
                        viewmodel.showStageTwo = true;
                        viewmodel.showStageThree = false;
                        viewmodel.showError = false;
                        viewmodel.emailMessage = true;
                        viewmodel.emailMsgshow = data.message;
                    } else {
                        viewmodel.showError = true;
                        viewmodel.error = 'Authentication failed';
                    }
                });
            }

        viewmodel.checkSecurityQuestions = function() {
            viewmodel.securityQuestionsArray = [];
            if ( viewmodel.checkSecurityQuestions.questions == undefined ) {
                viewmodel.showError = true;
                viewmodel.error = 'Please fill up the form';
            } else {
                viewmodel.showError = false;
                angular.forEach(viewmodel.DisplayQuestionsValues, function (value, key) {
                    viewmodel.securityQuestionsArray.push({
                        'question': value.question,
                        'answer': viewmodel.checkSecurityQuestions.questions[key]
                    })
                });
            }

            data = {
                'phase': 'checkSecurityQuestions',
                'userName': viewmodel.checkUsername.userName,
                'securityQuestions': viewmodel.securityQuestionsArray
            };

            AuthResetUserPass.passwordResetSection(data).success(function(data) {
                if (data.success) {
                    viewmodel.showStageTwo = false;
                    viewmodel.showError = false;
                    viewmodel.showSecurityQuestions = false;
                    viewmodel.showStageFour = true;
                } else {
                    viewmodel.showError = true;
                    viewmodel.error = 'Invalid Security Questions';
                }
            });
        }

        $rootScope.usernameExistWarning = null;
        $rootScope.validateUsernameExistance = function(username) { 
            if(!username.$error.email && username.$modelValue != undefined) { 
                UsernameValidation.checkUsername( username.$viewValue ).success(function(data) {
                    if(data.success) {
                        $rootScope.usernameExistWarning = data.message;
                    } else {
                       $rootScope.usernameExistWarning = null; 
                    }
                });
            }else{
                 $rootScope.usernameExistWarning = null; 
            }
        }
         $rootScope.removeWarning = function() {
            $rootScope.usernameExistWarning = null;
         }
        // viewmodel.checkVerificationKey = function() {
        //     data = {
        //         'phase': 'checkVerificationKey',
        //         'userName': viewmodel.checkUsername.userName,
        //         'type': viewmodel.loginData.type,
        //         'verificationCode': viewmodel.checkVerificationKey.verificationCode
        //     };
        //     AuthResetUserPass.passwordResetSection(data).success(function(data) {
        //         if (data.success) {
        //             viewmodel.showStageThree = false;
        //             viewmodel.showStageFour = true;
        //             viewmodel.showError = false;
        //         } else {
        //             viewmodel.showError = true;
        //             viewmodel.error = 'Invalid Verification Code';
        //         }
        //     });
        // }

        viewmodel.changePassword = function() {
            if (viewmodel.changePassword.password == viewmodel.changePassword.confirmPassword) {
                data = {
                    'phase': 'changePassword',
                    'userName': viewmodel.checkUsername.userName,
                    'securityQuestions': viewmodel.securityQuestionsArray,
                    'password': viewmodel.changePassword.password
                };
                AuthResetUserPass.passwordResetSection(data).success(function(data) {
                    if (data.success) {
                        viewmodel.showStageThree = false;
                        viewmodel.showStageFour = true;
                        viewmodel.showError = true;
                        viewmodel.successMsg = true;
                        viewmodel.showError = false;
                    } else {
                        viewmodel.showError = true;
                        viewmodel.error = data.message;
                    }
                });
            } else {
                viewmodel.showError = true;
                viewmodel.error = 'Invalid Passwrod';
            }
        }
        
             viewmodel.changePasswordbyEmail = function() {
            if (viewmodel.changePassword.password == viewmodel.changePassword.confirmPassword) {
                data = {
                    'phase': 'changePasswordbyEmail',
                    'userName': viewmodel.checkUsername.userName,
                    'securityQuestions': viewmodel.securityQuestionsArray,
                    'password': viewmodel.changePassword.password,
                    'code': $routeParams.code,
                    'id': $routeParams.id
                };
                AuthResetUserPass.passwordResetSection(data).success(function(data) {
                    if (data.success) {
                        viewmodel.passwordChange = false;
                        viewmodel.successMsg = true;
                        viewmodel.showError = false;
                    } else {
                        viewmodel.showError = true;
                        viewmodel.error = data.message;
                    }
                });
            } else {
                viewmodel.showError = true;
                viewmodel.error = 'Password not match';
            }
        }

        viewmodel.searchSp = function() {
            if( !viewmodel.searchSpBox ) { viewmodel.spList = {}; return; }
            landingPage.spSearchNames(viewmodel.searchSpBox).then(function(data) {
                viewmodel.spList = data.data;
            });

        }
    })

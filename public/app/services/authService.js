angular.module('authService', [])
    .factory('Auth', function($http, $q, AuthToken) {

        var authFactory = {};

        authFactory.login = function(userName, password ,fromDevice) {
            return $http.post('/api/authenticate', {
                userName: userName,
                password: password,
                device : fromDevice,
            }).success(function(data) { 
                AuthToken.setToken(data.token);
                return data;
            });
        };

        authFactory.logout = function() {
            AuthToken.setToken();
        };

        authFactory.isLoggedIn = function() {
            return AuthToken.getToken() ? true : false;
        };

        authFactory.getUser = function() {
            if (AuthToken.getToken()) {
                return $http.get('/api/me', { cache: false });
            }
            else {
                return $q.reject({ message: 'User is not authenticated' });
            }
        };

        return authFactory;
    })
    .factory('AuthToken', function($window) {
        var authTokenFactory = {};

        authTokenFactory.getToken = function() {
            return $window.localStorage.getItem('token');
        };

        authTokenFactory.setToken = function(token) {

            if (token) {
                $window.localStorage.setItem('token', token);
            }
            else {
                $window.localStorage.removeItem('token');
            }
        };

        return authTokenFactory;
    })
    .factory('AuthInterceptor', function($q, $location, AuthToken) {
        var intercepterFactory = {};

        intercepterFactory.request = function(config) {

            var token = AuthToken.getToken();

            if (token) {
                config.headers['x-access-token'] = token;
            }

            return config;
        };

        intercepterFactory.responseError = function(response) {
            if (response.status == 403) {
                AuthToken.setToken();
                $location.path('/login');
            }

            return $q.reject(response);
        };

        return intercepterFactory;
    }).factory('AuthResetUserPass', function($http, $q ) {
        factory = {};

        factory.passwordResetSection = function(data) {
            return $http.post('/api/passwordReset', data).success(function(data) {
                return data;
            });
        }
        
        return factory;
    }).factory('UsernameValidation', function($http, $q ) {
        factory = {};

        factory.checkUsername = function(username) {
            return $http.get('/api/usernameValidation/' + username ).success(function(data) {
                return data;
            });
        }

        return factory;
    }).factory('VerifyMobile', function($http, $q ) {
        factory = {};

        factory.SMSRequest = function(userid, mobile_number) {
            var def=$q.defer();
             return $http.post('/api/SMSRequest/' + userid + '/mobileNumber/' + mobile_number).success(function(data) {
                return data;
            });
        }
        return factory;
    }).factory('landingPage', function($http, $q){

        factory = {};

        factory.spSearchNames = function(keyWord) {
            var def = $q.defer();
            return $http.get('/api/searchServiceProviders/' + keyWord ).success(function(data) {
                return data;
            });
        }

        return factory;

    })
angular.module('customerService', [])
    .factory('cAppService', function($http, $q) {

        var spFactory = {};

        spFactory.get = function(id) {
            var def = $q.defer();
            return $http.get('/api/customer/' + id)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        spFactory.all = function() {
            return $http.get('/api/customer/');
        };

        spFactory.create = function(data) {
            var def = $q.defer();
            return $http.post('/api/customer', data)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
            // return $http({
            //     method: 'POST',
            //     url: 'http://smartconnections.herokuapp.com/api/customer',
            //     data: data
            // });
        };

        spFactory.createAppointment = function(data) {
            var def = $q.defer();
            return $http.post('/api/customer/scheduleAppointment/', data)
                .then(function(responce) {

                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {

                        def.reject(responce);
                        return def.promise;
                    });

        };

        spFactory.getAppointmentDetails = function(spId) {
            var def = $q.defer();
            return $http.get('/api/customer/scheduleAppointment/' + spId)
                .then(function(response) {

                        def.resolve(response.data);
                        return def.promise;
                    },
                    function(response) {

                        def.reject(response);
                        return def.promise;
                    });
        }

        spFactory.getAppointmentShedules = function(date, id, empId) {

            var def = $q.defer();
            return $http.get('/api/customer/scheduleAppointment/shedules/' + date + '/id/' + id + '/empId/' + empId)
                .then(function(response) {

                        def.resolve(response.data);
                        return def.promise;
                    },
                    function(response) {

                        def.reject(response);
                        return def.promise;
                    });
        }

        spFactory.getAppointmentDetailsByRefNo = function(no, spId) {

            var def = $q.defer();
            return $http.get('/api/customer/scheduleAppointment/refNo/' + no + '/spId/' + spId)
                .then(function(response) {

                        def.resolve(response.data);
                        return def.promise;
                    },
                    function(response) {

                        def.reject(response);
                        return def.promise;
                    });
        }



        spFactory.lastAppointment = function(empId, apId, currentdate) {
            var def = $q.defer();
            return $http.get('/api/customer/scheduleAppointment/last/empId/' + empId + '/apId/' + apId + '/' + currentdate)
                .then(function(responce) {
                    def.resolve(responce.data);
                    return def.promise;
                }, function(responce) {
                    def.reject(responce);
                    return def.promise;
                })
        }

        spFactory.appointmentSheduleCheck = function(id, action) {
            var def = $q.defer();
            return $http.put('/api/customer/appointmentSheduleCheck/' + id + '/update/' + action)
                .then(function(response) {

                        def.resolve(response.data);
                        return def.promise;
                    },
                    function(response) {

                        def.reject(response);
                        return def.promise;
                    });
        }

        spFactory.appointmentWeeks = function(date, id, empId, custId) {
            var def = $q.defer();
            return $http.get('/api/customer/scheduleAppointment/slots/' + date + '/id/' + id + '/emp/' + empId + '/view/week/customer/' + custId)
                .then(function(responce) {
                    def.resolve(responce.data);
                    return def.promise;
                }, function(responce) {
                    def.reject(responce);
                    return def.promise;
                })
        }

        spFactory.cancelAppointment = function(id) {
            var def = $q.defer();
            return $http.post('/api/customer/cancelAppointment/' + id)
                .then(function(responce) {

                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {

                        def.reject(responce);
                        return def.promise;
                    });
        }

        spFactory.update = function(id, data) {
            var def = $q.defer();
            return $http.put('/api/customer/' + id, data)
                .then(function(responce) {

                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {

                        def.reject(responce);
                        return def.promise;
                    });
        };

        spFactory.delete = function(id) {
            return $http.delete('/api/customer/' + id);
        };

        spFactory.sendEmail = function(emailData) {
            var def = $q.defer();
            return $http.post('/api/customer/sendEmail/', emailData)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {

                        def.reject(responce);
                        return def.promise;
                    });
        }

        return spFactory;
    });

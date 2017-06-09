angular.module('employeeService', [])
    .factory('empAppService', function($http,$q) {

        var empFactory = {};

        empFactory.get = function(id, provider_id) {
            var def=$q.defer();
            return $http.get('/api/serviceprovider/' + provider_id + '/employee/' + id)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                   return def.promise;
            });
        };

        empFactory.all = function(provider_id) {
             var def=$q.defer();
            return $http.get('/api/serviceprovider/' + provider_id + '/employee/')
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        };

        empFactory.create = function(data, provider_id) {
              var def=$q.defer();
            return $http.post('/api/serviceprovider/' + provider_id + '/employee', data)
               .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        };

        empFactory.update = function(id, data) {
            var def = $q.defer();
            return $http.put('/api/serviceprovider/' + data.serviceProviderId + '/employee/' + id, data)
            .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        };

        empFactory.deleteemployee = function(id, provider_id) {
            var def = $q.defer();
            return $http.delete('/api/serviceprovider/' + provider_id + '/employee/' + id)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        };

        empFactory.loadReferenceNumbers = function(id, date) {
          var def = $q.defer();
            return $http.get('/api/customer/referenceNumbers/employee/' + id + '/date/' + date)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        }

        empFactory.spDetails = function(id) {
          var def = $q.defer();
            return $http.get('/api/serviceProvider/employee/' + id)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        }

        empFactory.getCustomerDetails = function(id, date) {
          var def = $q.defer();
            return $http.get('/api/customer/customerDetails/customer/' + id)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        }

        empFactory.saveClosing = function(data) {
          var def = $q.defer();
            return $http.post('/api/serviceProvider/closeAppointment/', data)
             .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        }

        return empFactory;
    });

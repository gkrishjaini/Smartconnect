angular.module('serviceProviderService', [])
    .factory('spAppService', function($http,$q) {

        var spFactory = {};
       
        spFactory.get = function(id) {
            var def=$q.defer();
            return $http.get('/api/serviceprovider/' + id)
            .then(function(responce){
                  def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                   def.reject(responce);
                   return def.promise;
            });
        };

        spFactory.all = function() {
             var def=$q.defer();
            return $http.get('/api/serviceprovider/')
              .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                   return def.promise;
            });
             
        };
        
        spFactory.allAppointmentList = function(data) {
            var def=$q.defer();
            return $http.post('/api/serviceprovider/appointments/', data)
              .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                   return def.promise;
            });
        }

        //  spFactory.allSPShortList = function() {
        //     var def=$q.defer();
        //     return $http.get('/api/serviceprovider/shortlist')
        //       .then(function(responce){                  
        //            def.resolve(responce.data);
        //           return def.promise;
        //         },
        //         function(responce){
        //           def.reject(responce);
        //            return def.promise;
        //     });
        // }
        
        spFactory.unApprovedSpList = function() {
            var def=$q.defer();
            return $http.get('/api/unApprovedSpList/')
              .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                   return def.promise;
            });
        };


        spFactory.create = function(data) {
            var def=$q.defer();
            return $http.post('/api/serviceprovider', data)
            .then(function(responce){                  
                   def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                   return def.promise;
            });
        };

        spFactory.update = function(id, data) {
            var def=$q.defer(); 
            return $http.put('/api/serviceprovider/' + id, data)
             .then(function(responce){
                  def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
            
        };

        spFactory.updateSpApprove = function(id, type,reason) {
            var def=$q.defer(); 
            return $http.put('/api/updateSpApprove/' + id + '/action/' + type + '/'+ reason)
             .then(function(responce){
                  def.resolve(responce.data);
                  return def.promise;
                },
                function(responce){
                  def.reject(responce);
                  return def.promise;
            });
        };

        spFactory.delete = function(id) {
            return $http.delete('/api/serviceprovider/' + id);
        };

        spFactory.getUploads = function(id) {
          var def=$q.defer();
          return $http.get('/api/serviceprovider/' + id + '/uploads')
          .then(function(responce){                  
                 def.resolve(responce.data);
                return def.promise;
              },
              function(responce){
                def.reject(responce);
                 return def.promise;
          });
        };

        spFactory.getUploadedKnowledgebase = function(appointId,provider_id){
          var def = $q.defer();
          return $http.get('/api/serviceprovider/appointmentDefinition/' + appointId + '/uploads/' + provider_id + '/')
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            },
            function (responce) {
              def.reject(responce);
              return def.promise;
            });
        };

        spFactory.deleteUploads = function(content_id, provider_id) {
          var def=$q.defer();
          return $http.delete('/api/serviceprovider/' + provider_id + '/uploads/' + content_id)
          .then(function(responce){                  
                 def.resolve(responce.data);
                return def.promise;
              },
              function(responce){
                def.reject(responce);
                return def.promise;
          });
        };

        spFactory.deleteKnowledgebase = function(content_id, provider_id) {
          var def=$q.defer();
          return $http.delete('/api/serviceprovider/appointmentDefinition/' + provider_id + '/uploads/' + content_id)
          .then(function(responce){                  
                 def.resolve(responce.data);
                return def.promise;
              },
              function(responce){
                def.reject(responce);
                return def.promise;
          });
        };
        
        spFactory.verify = function (code, id) {
          var def = $q.defer();
          return $http.get('/api/verify/' + code + '/' + id + '/')
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            }, function (responce) {
              def.reject(responce);
              return def.promise;
            });
        };

        spFactory.saveAppointDefinition =function(data){
          var def = $q.defer();
          return $http.post('/api/serviceprovider/appointmentDefinition/' , data)
          .then(function(responce){
            def.resolve(responce.data);
            return def.promise;
          },function(responce){
            def.reject(responce);
            return def.promise;
          })
        };

        spFactory.updateAppointDefinition =function(data , id){
          var def = $q.defer();
          return $http.put('/api/serviceprovider/appointmentDefinition/'+ id +'/' , data)
          .then(function(responce){
            def.resolve(responce.data);
            return def.promise;
          },function(responce){
            def.reject(responce);
            return def.promise;
          })
        };

        spFactory.deleteAppointment = function(id , provider_id){
          var def = $q.defer();
          return $http.delete('/api/serviceprovider/appointmentDefinition/' + id + '/' + provider_id + '/')
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            }, function (responce) {
              def.reject(responce);
              return def.promise;
            })
        };

        spFactory.appointmentList = function(id){
          var def = $q.defer();
          return $http.get('/api/serviceprovider/appointmentDefinition/'+ id +'/')
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            }, function (responce) {
              def.reject(responce);
              return def.promise;
            })
        }

        spFactory.appointmentSheduleReport = function(data){
          var def = $q.defer();
          return $http.post('/api/customer/scheduleAppointment/appointmentReport/', data)
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            }, function (responce) {
              def.reject(responce);
              return def.promise;
            })
        }

        spFactory.AppointmentCount = function (id) {
          var def = $q.defer();
          return $http.get('/api/serviceprovider/appointmentDefinitionCount/' + id + '/')
            .then(function (responce) {
              def.resolve(responce.data);
              return def.promise;
            }, function (responce) {
              def.reject(responce);
              return def.promise;
            })
        }


        spFactory.spSearch = function(values) {
            var def = $q.defer();
            return $http.post('/api/serviceprovider/search/' , values)
            .then(function(responce){
              def.resolve(responce.data);
              return def.promise;
            },function(responce){
              def.reject(responce);
              return def.promise;
            })
        }

        spFactory.gridViewSearch = function(type, value) {
            var def = $q.defer();
            return $http.get('/api/gridViewPopulate/type/' + type + '/value/' +  value)
            .then(function(responce){
              def.resolve(responce.data);
              return def.promise;
            },function(responce){
              def.reject(responce);
              return def.promise;
            })
        }

        return spFactory;        
    });
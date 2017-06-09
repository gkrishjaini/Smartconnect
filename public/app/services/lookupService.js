angular.module('lookupService', [])
    .factory('lookupAppService', function($http, $q) {

        var lookUpFactory = {};

        lookUpFactory.get = function(provider_id, lookup_type) {
            var def = $q.defer();
            return $http.get('/api/serviceprovider/lookup/' + provider_id + '/' + lookup_type + '/')
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        lookUpFactory.updateLookupValue = function(provider_id, lookup_type, data) {
            var def = $q.defer();
            return $http.put('/api/serviceprovider/lookup/' + provider_id + '/' + lookup_type + '/', data)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        lookUpFactory.createLookupValue = function(provider_id, lookup_type, data) {
            var def = $q.defer();
            return $http.post('/api/serviceprovider/lookup/' + provider_id + '/' + lookup_type + '/', data)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        }

        lookUpFactory.createSubLookupType = function() {
            var def = $q.defer();
            return $http.post('/api/serviceprovider/lookup/' + provider_id + '/' + lookup_type + '/', data)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        }

        lookUpFactory.getLookupTypes = function() {
            var def = $q.defer();
            return $http.get('api/lookuptype/')
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        lookUpFactory.getLookupTypesByProviderId = function(provider_id) {
            var def = $q.defer();
            return $http.get('api/lookuptype/' + provider_id)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };


        lookUpFactory.getChildLookupType = function(parentLookupId, provider_id) {
            var def = $q.defer();
            return $http.get('api/lookuptype/' + parentLookupId + '/' + provider_id)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        }

        lookUpFactory.createLookupType = function(data) {
            var def = $q.defer();
            return $http.post('/api/lookupType/', data)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        }

        /*  lookUpFactory.getLookupValues = function() {

          };*/

        lookUpFactory.deletelookUp = function(id, provider_id) {
            var def = $q.defer();
            return $http.delete('/api/serviceprovider/lookup/' + provider_id + '/' + id + '/')
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });

        };

        lookUpFactory.deletelookUpType = function(id) {
            var def = $q.defer();
            return $http.delete('/api/lookupType/' + id)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        lookUpFactory.getLookUpItemValues = function(id, provider_id) {
            var def = $q.defer();
            return $http.get('/api/serviceprovider/lookup/' + provider_id + '/lookup/' + id + '/')
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });

        };

        lookUpFactory.getSubCategory = function(id, provider_id) {
            var def = $q.defer();
            return $http.get('/api/serviceprovider/lookup/appointmentDefinition/' + provider_id + '/' + id + '/')
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });

        }

        lookUpFactory.regularLookups = function(lookup_type) {
            var def = $q.defer();
            return $http.get('/api/regularLookups/' + lookup_type)
                .then(function(responce) {
                        def.resolve(responce.data);
                        return def.promise;
                    },
                    function(responce) {
                        def.reject(responce);
                        return def.promise;
                    });
        };

        return lookUpFactory;
    });

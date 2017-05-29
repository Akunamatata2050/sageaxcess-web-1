(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
  angular.module('app').factory('NetworksSvc', NetworksSvc);

  NetworksSvc.$inject = [
    '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function NetworksSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/location-network/?nw=:nw', {}, {        
        'update': {
          'method': 'PUT',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },        
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },        
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        },
        'add':{
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },
        'delete': {
          'method': 'DELETE',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    } 

    function get(id) {
      var deferred;
      deferred = $q.defer();
      service().get({
        'id': id
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }
    
    function list() {
      var deferred;
      deferred = $q.defer();
      service().list({
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function save(data) {
      var deferred;
      deferred = $q.defer();
      service().add(data, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function remove(networkAddress) {
  var deferred;
  deferred = $q.defer();
  service()['delete']({
    'nw': networkAddress
  }, function(keys) {
    return deferred.resolve(keys);
  }, function(err) {
    return deferred.reject(err);
  });
  return deferred.promise;
}

    return {
      get: get,
      list: list,
      save: save,
      remove: remove
    };
  }

})();
(function() {
  'use strict';

  angular.module('app').factory('KeyPairSvc', KeyPairSvc);

  KeyPairSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function KeyPairSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/key-pair/:id/?', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        },
        'add': {
          'method': 'POST',
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
        'delete': {
          'method': 'DELETE',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function list() {
      var deferred;
      deferred = $q.defer();
      service().list({}, function(keys) {
        return deferred.resolve(keys);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function get(id) {
      var deferred;
      deferred = $q.defer();
      service().get({
        'id': id
      }, function(key) {
        return deferred.resolve(key);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function save(key) {
      var deferred;
      deferred = $q.defer();
      if (key.EntityID) {
        service().update({}, key, function(resp) {
          return deferred.resolve(resp);
        }, function(err) {
          return deferred.reject(err);
        });
      } else {
        service().add({}, key, function(resp) {
          return deferred.resolve(resp);
        }, function(err) {
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    function remove(id) {
      var deferred;
      deferred = $q.defer();
      service()['delete']({
        'id': id
      }, function(keys) {
        return deferred.resolve(keys);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    return {
      list: list,
      get: get,
      save: save,
      remove: remove
    };




  }

})();



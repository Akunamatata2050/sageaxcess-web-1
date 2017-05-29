(function() {
  'use strict';

  function FirstTimeEntitiesSvc($resource, $cookies, $q, ENV, SessionService, localStorageService, $rootScope) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/first-time-entities/:id/?', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        },
        'get': {
          'method': 'GET',
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
      service().list({}, function(users) {
        return deferred.resolve(users);
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
      }, function(users) {
        return deferred.resolve(users);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }


    return {
      list: list,
      get: get
    };
  }

  FirstTimeEntitiesSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService', 'localStorageService', '$rootScope'
  ];

  angular
  .module('app')
  .factory('FirstTimeEntitiesSvc', FirstTimeEntitiesSvc);
})();

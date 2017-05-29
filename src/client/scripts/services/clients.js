(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
  angular.module('app').factory('ClientsSvc', ClientsSvc);

  ClientsSvc.$inject = [
    '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function ClientsSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/client/:id/?mode=:mode', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        },
        'update': {
          'method': 'PUT',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
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

    function list(all) {
      var deferred;
      deferred = $q.defer();
      var data = {};
      if(all){
        data["mode"] = "all";
      }

      service().list(data, function(clients) {
        return deferred.resolve(clients);
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
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function save(client) {
      var deferred;
      deferred = $q.defer();
      if (client.EntityID) {
        service().update({}, client, function(resp) {
          return deferred.resolve(resp);
        }, function(err) {
          return deferred.reject(err);
        });
      } else {
        service().add({}, client, function(resp) {
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
      }, function(users) {
        return deferred.resolve(users);
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
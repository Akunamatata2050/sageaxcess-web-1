(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
   angular.module('app').factory('OfficesSvc', OfficesSvc);

   OfficesSvc.$inject = [
   '$resource', '$cookies', '$q', 'ENV', 'SessionService', '$rootScope'
   ];

   function OfficesSvc($resource, $cookies, $q, ENV, SessionService, $rootScope) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/client/office/:id/?ps=:ps&cp=:cp&sort=:sort&search=:search', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
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

function list(ps, cp, sort, search) {
  var deferred;      
  deferred = $q.defer();      
 
  service().list({'ps': ps?ps:10, 'cp': cp?cp:1, 'sort': sort,'search': search?encodeURIComponent(search):''}, function(resp) {
    return deferred.resolve(resp);
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
  }, function(resp) {
    return deferred.resolve(resp);
  }, function(err) {
    return deferred.reject(err);
  });
  return deferred.promise;
}

function save(office) {
  var deferred;
  deferred = $q.defer();  
  
  if (office.EntityID) {
    service().update({'id': office.EntityID}, office, function(resp) {
      return deferred.resolve(resp);
    }, function(err) {
      return deferred.reject(err);
    });
  } else {
    service().add({}, office, function(resp) {
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
  }, function(resp) {
    return deferred.resolve(resp);
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
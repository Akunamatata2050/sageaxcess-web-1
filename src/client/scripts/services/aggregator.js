(function() {
  'use strict';

  angular.module('app').factory('AggregatorSvc', AggregatorSvc);

  AggregatorSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function AggregatorSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/aggregator-service/:id/?uniqueId=:uniqueId&clientId=:organizationId', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        }
      });
}

 function idService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/aggregator-service/:id', {}, {
        
        'delete': {
          'method': 'DELETE',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
}

function list(organizationId) {
  var deferred;
  deferred = $q.defer();
  service().list({'organizationId': organizationId}, function(resp) {
    return deferred.resolve(resp);
  }, function(err) {
    return deferred.reject(err);
  });
  return deferred.promise;
}  

function remove(id) {
  var deferred;
  deferred = $q.defer();
  idService()['delete']({
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
  remove: remove
};  
}

})();

(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
   angular.module('app').factory('PeerGroupsSvc', PeerGroupsSvc);

   PeerGroupsSvc.$inject = [
   '$resource', '$cookies', '$q', 'ENV', 'SessionService'
   ];

   function PeerGroupsSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/client/peer-group/:id/?', {}, {
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
        }
      });
    }

    function list() {
      var deferred;      
      deferred = $q.defer();      

      service().list({}, function(resp) {
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function save(group){
      var deferred;      
      deferred = $q.defer();      

      service().update({'id': group.EntityID}, group, function(resp){
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    return {
      list: list,
      save: save

    };
  }

})();
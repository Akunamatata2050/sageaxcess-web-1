(function() {
  'use strict';

  angular.module('app').factory('UIMetricsSvc', UIMetricsSvc);

  UIMetricsSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function UIMetricsSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/ui-metrics/?', {}, {
        'add': {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function save(data) {
      var deferred;
      deferred = $q.defer();

      service().add({}, data, function(resp) {
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });

      return deferred.promise;
    }

    return {     
      save: save
    };  
  }

})();
(function() {
  'use strict';
  angular.module('app').service('AccessSvc', [
    'SessionService', '$q', function(SessionService, $q) {
      return function() {
        var deferred;
        deferred = $q.defer();
        if (SessionService.isAuthorized()) {
          deferred.resolve(true);
        } else {
          deferred.reject('error - not loggedin');
        }
        return deferred.promise;
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
  angular.module('app').factory('DashboardSvc', DashboardSvc);

  DashboardSvc.$inject = [
    '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function DashboardSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/report/dashboard/:feature/?by=:by', {}, {       
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
        }        
      });
    }

    function getStatistics() {
       var deferred;
      deferred = $q.defer();
      service().get({
        'feature': 'statistics'
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getRegionsData(regionsBy) {
       var deferred;
      deferred = $q.defer();
      service().list({
        'feature': 'regions',
        'by': regionsBy
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getDepartmentsData() {
       var deferred;
      deferred = $q.defer();
      service().list({
        'feature': 'departments'
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getConnections() {
       var deferred;
      deferred = $q.defer();
      service().list({
        'feature': 'connections'
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getActivities() {
       var deferred;
      deferred = $q.defer();
      service().list({
        'feature': 'activities'
      }, function(client) {
        return deferred.resolve(client);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    return {
      getStatistics: getStatistics,
      getRegionsData: getRegionsData,
      getDepartmentsData: getDepartmentsData,
      getConnections: getConnections,
      getActivities: getActivities
    };
  }

})();
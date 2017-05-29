(function() {
  'use strict';

  angular.module('app').factory('RiskEventSvc', RiskEventSvc);

  RiskEventSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService', '$rootScope'
  ];

  function RiskEventSvc($resource, $cookies, $q, ENV, SessionService, $rootScope) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/risk-event/:id/?startDate=:startDate&endDate=:endDate', {}, {
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
        }
      });
    }

    function getMomentDate(dt_str){
      return moment(dt_str, ['YYYY-MM-DDTHH:mm:ss.SSSSZ', 'YYYY-MM-DDTH:mm:ss.SSSSZ']);
    }

    function list(startDate, endDate) {   
      var deferred;
      deferred = $q.defer();  
      service().list({'startDate':startDate?startDate.format('YYYY-MM-DD'):'', 'endDate': endDate?endDate.format('YYYY-MM-DD'):''}, function(resp) {
        var map = {};
        var midNightEvents={};
        resp.Result.forEach(function(item){
          if (item.IP in map){
            if(map[item.IP].indexOf(item.AnomalyID) !== -1){
              midNightEvents[item.IP]=item.WindowID;
              item.IP += '_1';              
            } else{
               map[item.IP].push(item.AnomalyID);               
               if(item.IP in midNightEvents && getMomentDate(item.WindowID).isAfter(getMomentDate(midNightEvents[item.IP]))){
                item.IP += '_1';
               }
            }
          } else{
             map[item.IP] = [];
             map[item.IP].push(item.AnomalyID);
          }
        });
        return deferred.resolve(resp);        
      }, function(err) {
        return deferred.reject(err);
      });      
      return deferred.promise;
    }  

    function get(id, startDate, endDate) {
      var deferred;
      deferred = $q.defer();
      service().get({'startDate':startDate?startDate:'', 'endDate': endDate?endDate:'', 'id': id.split('.').join('_')}, function(resp) {
        return deferred.resolve(resp);
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

})();

(function() {
  'use strict';

  /*
   @ngdoc service
   @name app.client
   @description
   client
   Service in the app.
   */
   angular.module('app').factory('ReportsSvc', ReportsSvc);

   ReportsSvc.$inject = [
   '$resource', '$cookies', '$q', 'ENV', 'SessionService', 'notificationService', '$rootScope'
   ];

   function ReportsSvc($resource, $cookies, $q, ENV, SessionService, notificationService, $rootScope) {

    function service(serviceName) {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/report/'+serviceName+'/?startDate=:startDate&endDate=:endDate&limit=:limit&userId=:userId&includeBroadcast=:includeBroadcast&officeId=:officeId&systemId=:systemId', {}, {       
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function userDetailsService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/report/user-details/:id?officeId=:officeId', {}, {
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function groupsService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/report/peer-groups/?clientId=:clientId', {}, {
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function anomalyService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/report/anomaly/?clientId=:clientId', {}, {
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function getUserDetailsData(id, officeId) {      
      var deferred;
      deferred = $q.defer();
      userDetailsService().get({'id':id, 'officeId': officeId}, function(resp) {
        return deferred.resolve(resp);
      }, function(err) {
        notificationService.error('Server error occured!');
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getGroupsData() {      
      var deferred;
      deferred = $q.defer();
      groupsService().get({}, function(resp) {
        return deferred.resolve(resp);
      }, function(err) {
        notificationService.error('Server error occured!');
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getAnomalyData(startDate, endDate, officeId) {      
      var deferred;
      deferred = $q.defer();
      anomalyService().get({'startDate':startDate?startDate.format('YYYY-MM-DD'):'', 'endDate': endDate?endDate.format('YYYY-MM-DD'):'', 'officeId': officeId}, function(resp) {
        return deferred.resolve(processSystemsOverviewData(resp, true));
      }, function(err) {
        notificationService.error('Server error occured!');
        return deferred.reject(err);
      });
      return deferred.promise;
    }    

    function getActivityData(userId, dataStartDate, dataEndDate, includeBroadcast, officeId, systemId) {            
      var deferred;
      deferred = $q.defer();
      //console.log(userId, dataStartDate, dataEndDate, includeBroadcast, officeId, systemId)
      service('systems').get({'startDate': dataStartDate?dataStartDate.format('YYYY-MM-DD'):'', 'endDate': dataEndDate?dataEndDate.format('YYYY-MM-DD'):'',
       'limit': userId?-1:1000, 'userId': userId, 'includeBroadcast': includeBroadcast?'true':'false', 'officeId': officeId, 'systemId':systemId}, function(data) {       
        return deferred.resolve(processSystemsOverviewData(data));
      }, function(err) {
        notificationService.error('Server error occured!');
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function getDetailedActivityData(userId, dataStartDate, dataEndDate, includeBroadcast, officeId, systemId, summaryData) {            
      var deferred;
      deferred = $q.defer();
      //console.log(userId, dataStartDate, dataEndDate, includeBroadcast, officeId, systemId)
      service('systems/details').get({'startDate': dataStartDate?dataStartDate.format('YYYY-MM-DD'):'', 'endDate': dataEndDate?dataEndDate.format('YYYY-MM-DD'):'',
       'limit': userId?-1:1000, 'userId': userId, 'includeBroadcast': includeBroadcast?'true':'false', 'officeId': officeId, 'systemId':systemId}, function(data) {       
        data["Summary"] = summaryData;
        return deferred.resolve(processSystemsOverviewData(data));
      }, function(err) {
        notificationService.error('Server error occured!');
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function processSystemsOverviewData(overviewData, isAnomalyData){
      console.log('Users count', overviewData.Users.length);
      if(overviewData.Data && Object.keys(overviewData.Data).length >0){
        var arrayData = convertDataToArray(overviewData.Data, isAnomalyData);

        overviewData.average = averageData(0, arrayData, {});
        overviewData.separate = getSeparateData(overviewData, isAnomalyData);

        overviewData.StartDate = arrayData[0].date;
        overviewData.EndDate = arrayData[arrayData.length - 1].date;        
      }      
      

      return overviewData;
    }

    function averageData(index, source, result) {
      if (index >= source.length) {
        return result;
      }

      var key, m, i, v;

      for (key in source[index].value) {
        m = source[index].value[key];

        if (!result[key]) {
          result[key] = {values:[], chart:{'Users':{values:[]}, 'Systems':{values:[], valuesByDay:[]}}};
        }

        result[key].min = Infinity;
        result[key].max = 0;
        result[key].chart.Users.min = Infinity;
        result[key].chart.Users.max = 0;
        result[key].chart.Systems.min = Infinity;
        result[key].chart.Systems.max = 0;

        for (i = 0; i < m.length; i++) {

          if (result[key].values.length <= i) {
            result[key].values.push([]);
            result[key].chart.Users.values.push(0);
          }

          for (v = 0; v < m[i].length; v++) {

            if (result[key].values[i].length <= v) {
              result[key].values[i].push(0);
            }

            if (result[key].chart.Systems.values.length <= v) {
              result[key].chart.Systems.values.push(0);
            }

            result[key].values[i][v] += m[i][v] / source.length;
            result[key].min = Math.min(result[key].min, result[key].values[i][v]);
            result[key].max = Math.max(result[key].max, result[key].values[i][v]);

            result[key].chart.Users.values[i] += m[i][v] / (m[i].length * source.length);
            result[key].chart.Users.max = Math.max(result[key].chart.Users.max, result[key].chart.Users.values[i]);
            result[key].chart.Users.min = Math.min(result[key].chart.Users.min, result[key].chart.Users.values[i]);

            result[key].chart.Systems.values[v] += m[i][v] / (m.length * source.length);
            if(!result[key].chart.Systems.valuesByDay[index]){
              result[key].chart.Systems.valuesByDay[index] = [];
            }
            if(!result[key].chart.Systems.valuesByDay[index][v]){
              result[key].chart.Systems.valuesByDay[index][v] = 0;
            }

            //4 is the number of days segments accounted for each day.
            result[key].chart.Systems.valuesByDay[index][v] += (m[i][v] / (m.length * 4));
            result[key].chart.Systems.max = Math.max(result[key].chart.Systems.max, result[key].chart.Systems.values[v]);
            result[key].chart.Systems.min = Math.min(result[key].chart.Systems.min, result[key].chart.Systems.values[v]);
          }
        }
      }

      return averageData(index + 1, source, result);
    }


    function convertDataToArray(value, isAnomalyData) {
      var key;
      var arr = [];

      for (key in value) {                
        var format = 'YYYY-MM-DD';
        if(isAnomalyData){
          format = 'MM-DD-YYYY';
        }        
        arr.push({date:moment.utc(key, format), value:value[key]});
      }

      arr.sort(function(a, b){ return a.date.valueOf() - b.date.valueOf(); });
      return arr;
    }

    function getSeparateData(data, isAnomalyData) {
      var arr = convertDataToArray(data.Data, isAnomalyData);
      var res = {};
      var i, u, s, key, endVal;

      for (i = 0; i < arr.length; i++) {

        for (key in arr[i].value) {
          if (!res[key]) {
            res[key] = {
              'Users':{min:Infinity, max:-Infinity, avgMax:0, data:[]}, 
              'Systems':{min:Infinity, max:-Infinity, avgMax:0, data:[]},
            };
          }


          for (u = 0; u < data.Users.length; u++) {
            if (res[key].Users.data.length <= u) {
              res[key].Users.data.push({min:Infinity, max:-Infinity, avgMax:-Infinity, avg:0, data:[], index:u, userId: data.UserIds?data.UserIds[u]:-1});
            }


            for (s = 0; s < data.Systems.length; s++) {
              if (res[key].Systems.data.length <= s) {
                res[key].Systems.data.push({min:Infinity, max:-Infinity, avgMax:-Infinity, avg:0, data:[], index:s});
              }

              if (res[key].Systems.data[s].data.length <= u) {
                res[key].Systems.data[s].data.push({key:data.Users[u], index:u, values:[], avg:0});
              }

              if (res[key].Users.data[u].data.length <= s) {
                res[key].Users.data[u].data.push({key:data.Systems[s], index:s, values:[], avg:0});
              }
              
             /* if(!arr[i].value[key][u]){
                arr[i].value[key][u] = [0,0,0,0,0,0];
              }*/

              endVal = [moment.utc(arr[i].date), arr[i].value[key][u][s]];

              res[key].Systems.data[s].data[u].values.push(endVal);
              res[key].Systems.data[s].data[u].avg += endVal[1] / arr.length;
              res[key].Systems.data[s].avgMax = Math.max(res[key].Systems.data[s].data[u].avg, res[key].Systems.data[s].avgMax);
              res[key].Systems.data[s].avg += endVal[1] / (data.Users.length * arr.length);

              res[key].Systems.min = Math.min(res[key].Systems.min, endVal[1]);
              res[key].Systems.max = Math.max(res[key].Systems.max, endVal[1]);
              res[key].Systems.avgMax = Math.max(res[key].Systems.avgMax, res[key].Systems.data[s].avgMax);

              res[key].Systems.data[s].min = Math.min(res[key].Systems.data[s].min, endVal[1]);
              res[key].Systems.data[s].max = Math.max(res[key].Systems.data[s].max, endVal[1]);


              res[key].Users.data[u].data[s].values.push(endVal);
              res[key].Users.data[u].data[s].avg += endVal[1] / arr.length;
              res[key].Users.data[u].avgMax = Math.max(res[key].Users.data[u].data[s].avg, res[key].Users.data[u].avgMax);
              res[key].Users.data[u].avg += endVal[1] / (data.Systems.length * arr.length);


              res[key].Users.min = Math.min(res[key].Users.min, endVal[1]);
              res[key].Users.max = Math.max(res[key].Users.max, endVal[1]);
              res[key].Users.avgMax = Math.max(res[key].Users.avgMax, res[key].Users.data[u].avgMax);

              res[key].Users.data[u].min = Math.min(res[key].Users.data[u].min, endVal[1]);
              res[key].Users.data[u].max = Math.max(res[key].Users.data[u].max, endVal[1]);
            }
          }
        }
      }

      return setColorsAndSort(mergeAverageValues(res));
    }

    function mergeAverageValues(data) {
      var i, v, key, keyD, itemKey;

      for (key in data) {
        for (keyD in data) {
          if (key !== keyD) {
            for (itemKey in data[keyD]) {
              for (i = 0; i < data[keyD][itemKey].data.length; i++) {
                for (v = 0; v < data[key][itemKey].data[i].data.length; v++) {
                  data[keyD][itemKey].data[i].data[v][key + 'Avg'] = data[key][itemKey].data[i].data[v].avg;
                }
              }
            }
          }
        }
      }

      return data;
    }

    function setColorsAndSort(data) {
      var i, key1, key2, d2,
      colors = ['#e63030', '#febb53', '#12a635', '#225d9d', '#d4d4d4'];

      for (key1 in data) {

        for (key2 in data[key1]) {
          d2 = data[key1][key2].data;
          setColors(d2, colors, 'avg');

          for (i = 0; i < d2.length; i++) {
            setColors(d2[i].data, colors, 'avg');
          }
        }
      }

      return data;
    }

    function setColors(data, colors, key) {
      var i, v,
      sorted = [];

      for (i = 0; i < data.length; i++) {
        sorted.push({index:i, key:data[i][key]});
      }

      sorted.sort(function(a, b){ return b.key - a.key; });

      for (v = 0; v < sorted.length; v++) {
        data[sorted[v].index].color = colors[Math.min(v, colors.length - 1)];
        data[sorted[v].index].order = v;
        data[sorted[v].index].residue = (v >= colors.length);
      }

      return data;
    }

    return {      
      getActivityData: getActivityData,
      getUserDetailsData:getUserDetailsData,
      getAnomalyData:getAnomalyData,
      getGroupsData:getGroupsData,
      getDetailedActivityData:getDetailedActivityData
    };
  }

})();
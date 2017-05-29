(function() {
  'use strict';
  angular.module('theme.core.reoi_details_controller', []).controller('REOIDetailsCtrl', REOIDetailsCtrl);


  REOIDetailsCtrl.$inject = [
  '$scope', '$location', '$routeParams', '$http', 'ENV','RiskEventSvc', '$rootScope', 'deviceDetector'
  ];

  function REOIDetailsCtrl($scope, $location, $routeParams, $http, ENV,RiskEventSvc, $rootScope, deviceDetector) {
    $scope.id = $routeParams.id;
    $scope.startDate = $location.search()['startDate'];
    $scope.endDate = $location.search()['endDate'];
    $scope.links = {};
    $scope.timelineOptions = {selectable:true};
    $scope.selectedEvents = [];
    $scope.allEventsIds = [];
    $scope.loading = true;

    $scope.isIEBrowser=(deviceDetector.browser==='ie');

    if($scope.isIEBrowser){
      $scope.setPosition=true;
    }
    else{
      $scope.setPosition=false;
    }
    
    
    $scope.$on('userLoaded', function(){      
      getDetails();
    });

    if($rootScope.loggedInUser) {
      getDetails();
    }

    $scope.$on('clientChanged', function(){      
      getDetails();
    });

    function getDetails(){
      RiskEventSvc.get($scope.id, $scope.startDate, $scope.endDate).then(function(resp) {      
        $scope.data = resp;
        $scope.loading = false;
        $scope.allEventsIds = getAllEventsIds();
        $scope.usersActivity = getAllUsers(resp);
        updateUsersActivity($scope.usersActivity);
        toggleAllEvents();
      });
    }


    function getAllUsers(data) {
      var i, k, item, users = {};

      for (i in data) {
        for (k in data[i].Data) {
          item = data[i].Data[k];
          users[data[i].Data[k].User] = 'loading';
        }
      }
      return users;
    }

    function updateUsersActivity(users) {
      angular.forEach(users, function(value, key){
        $http({
          method: 'GET',
          url: ENV.apiEndpoint + '/report/user-details/' + encodeURIComponent(key)
        }).then(function(d) { 
          users[key] = d.data.Active ? 'active' : 'inactive';
        });
      });
    }

    $scope.$watch('selectedEvents', function(n, o){
      if (n !== o) {
        $scope.selectedData = getSelectedEvents();
      }
    }, true);

    $scope.toggleAllEvents = toggleAllEvents;

    $scope.getFileTypeIcon = function(item) {
      var rel = {'pdf':'fa-file-pdf-o',
      'exe':'fa-file-code-o',
      'pptx':'fa-file-powerpoint-o',
      'ppt':'fa-file-powerpoint-o',
      'docx':'fa-file-word-o',
      'xlsx':'fa-file-excel-o',
      'xls':'fa-file-excel-o',
      'jpg':'fa-file-image-o',
      'jpeg':'fa-file-image-o',
      'gif':'fa-file-image-o',
      'png':'fa-file-image-o',
      'zip':'fa-file-archive-o',
      'rar':'fa-file-archive-o',
      'txt':'fa-file-text-o'
    };

    return '<i class="fa ' + (rel[item.value.split('.').pop()] || 'fa-file-o') + ' type-icon"></i>';
  };

  $scope.portsRowFunc = function(item){
    var sr = getPortsTraffic(item);
    return [bytes(sr.s), bytes(sr.r)];
  };

  $scope.sourceRowFunc = function(item){
    var sr = getSourceTraffic(item);
    return [bytes(sr.s), bytes(sr.r)];
  };

  $scope.portsHeaderFunc = function(data) {
    var s = 0, r = 0, sr;

    for (var i in data) {
      sr = getPortsTraffic(data[i]);
      s += sr.s;
      r += sr.r;
    }

    return ['Port', 'Sent ' + bytes(s), 'Received ' + bytes(r)];
  };

  $scope.sourceHeaderFunc = function(data) {
    var s = 0, r = 0, sr;

    for (var i in data) {
      sr = getSourceTraffic(data[i]);
      s += sr.s;
      r += sr.r;
    }

    return ['Hostname IP address', 'Sent ' + bytes(s), 'Received ' + bytes(r)];
  };

  function getSelectedEvents() {
    var ids = $scope.selectedEvents || [],
    res = [];

    for (var i in $scope.data.Anomalies) {
      if (ids.indexOf($scope.data.Anomalies[i].AnomalyID) > -1) {
        res.push($scope.data.Anomalies[i]);
      }
    }

    return res;
  }

  function getAllEventsIds() {
    var all = [];
    for (var i in $scope.data.Anomalies) {
      if (all.indexOf($scope.data.Anomalies[i].AnomalyID === -1)) {
        all.push($scope.data.Anomalies[i].AnomalyID);
      }
    }
    return all;
  }

  function toggleAllEvents() {
    if ($scope.selectedEvents.length === $scope.allEventsIds.length) {
      $scope.selectedEvents = [];
    }
    else {
      $scope.selectedEvents = $scope.allEventsIds.slice(0);
    }
    $scope.selectedData = getSelectedEvents();
  }

  function getPortsTraffic(item) {
    var i, s = 0, r = 0, sr;

    for (i in item.data) {
      sr = getRowBytes(item.data[i].items, item.data[i].field);
      s += sr.s;
      r += sr.r;
    }
    return {s:s, r:r};
  }

  function getSourceTraffic(item) {
    var i, s = 0, r = 0, sr;

    for (i in item.data) {
      sr = getRowBytes(item.data[i].items, 'SourcePort');
      s += sr.s;
      r += sr.r;
    }
    return {s:s, r:r};
  }

  function getRowBytes(rows, field) {
    var i, s = 0, r = 0, value;

    for (i in rows) {
      value = rows[i];

      if (field === 'SourcePort') {
        s += parseInt(value.SourceBytesSent);
        r += parseInt(value.SourceBytesReceived);
      }
      else if (field === 'DestinationPort') {
        s += parseInt(value.DestinationBytesSent);
        r += parseInt(value.DestinationBytesReceived);
      }
    }

    return {s:s, r:r};
  }

  function bytes(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {return '-';}
    if (typeof precision === 'undefined') { precision = 1;}
    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
    number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)|0 +  ' ' + units[number];
  }
}
}).call(this);

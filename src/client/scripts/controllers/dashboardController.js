angular
  .module('theme.core.dashboard_controller', [])
  .controller('DashboardController', ['$scope', '$location', '$http', '$timeout', 'RiskEventSvc', '$rootScope', 'UI', 'DashboardSvc',function($scope, $location, $http, $timeout, RiskEventSvc, $rootScope, UI, DashboardSvc) {
    'use strict';
    $scope.updateData = updateData;
    $scope.updateStatistics = updateStatistics;
    $scope.updateRegions = updateRegions;
    $scope.updateDepartments = updateDepartments;
    $scope.updateConnections = updateConnections;
    $scope.updateREI = updateREI;
    $scope.updateLocations = updateActivities;
    
    //Custom Code
    $scope.isLoggedInWithGmail = false;

    $scope.loading = {
      statistics: true,
      regions: true,
      departments: true,
      connections: true,
      rei: true,
      activities: true
    };

    $scope.getUsernameColor = function(str) {
      return UI.getColorByString(str, [20, 340], [50, 90], [90, 100]);
    };

    $scope.route = function(path) {
      $location.path(path);
    };

    $scope.aggregationOptions = ['Activities', 'Anomalies', 'Resources', 'Accounts'];
    $scope.data = {
      'regionsBy': $scope.aggregationOptions[0],
      'departmentsBy': $scope.aggregationOptions[0],
      'activeLocation': ''
    };
    $scope.sortOptions = {
      geo:{key:'Rank.Now', reverse:false},
      connections:{key:'Rank.Now', reverse:false},
      activities:{key:'EventDate', reverse:true, itemsPerPage:10}
    };

    if($rootScope.loggedInUser) {
      updateData();
    } else{
      $scope.$on('userLoaded', function(){              
        updateData();
      });
    }

    $scope.isEverythingLoading = function(){
      for (var key in $scope.loading) {
        if (!$scope.loading[key]) {
          return false;
        }
      }

      return true;
    };    

    function updateData() {
      updateStatistics();
      updateRegions();
      updateDepartments();
      updateConnections();
      updateREI();
      updateActivities();
      $scope.isLoggedInWithGmail = $rootScope.loggedInUser.gmail;
    }

    function updateStatistics() {
      $scope.loading.statistics = true;
      
      DashboardSvc.getStatistics().then(function(resp){
        $scope.loading.statistics = false;
        $scope.data.Statistics=resp;
      });
    }


    $scope.getAbsoluteDifference = function(a, b) {
      return Math.abs(a - b);
    };

    function updateRegions() {
      $scope.loading.regions = true;
      DashboardSvc.getRegionsData($scope.aggregationOptions.indexOf($scope.data.regionsBy)).then(function(resp){
        processRegionsData(resp);
        $scope.loading.regions = false;
      });

    }

    function processRegionsData(regions){
        var i;
        var maxValue = 0,
            mapValues = {},
            mapNames = {},
            mapColors = {};

        for (i = 0; i < regions.length; i++) {
          maxValue = Math.max(maxValue, regions[i].Percent.Now);
        }

        regions.forEach(function(region){
          mapValues[region.Code] =  region.Percent.Now;
          mapColors[region.Code] = 'rgba(' + [112, 79, 254] + ',' + (region.Percent.Now / maxValue) + ')';
          mapNames[region.Code] = region.Name;
        });

        $scope.data.Regions = setRanks(regions, 'Count');

        $scope.data.Map = {
          values: mapValues,
          colors: mapColors,
          names: mapNames,
          maxPercentValue: maxValue
        };
    }

    function updateDepartments() {
      $scope.loading.departments = true;

      DashboardSvc.getDepartmentsData().then(function(resp){
        if (Array.isArray(resp)) {
          var i, res = [], max = 0;
          resp.sort(function(a, b) {
            return b.Value - a.Value;
          });

          for (i = 0; i < resp.length && i < 10; i++) {
            res.push(resp[i]);
            max = Math.max(max, resp[i].Value);
          }

          $scope.data.Departments = {values:res, maxValue:max};
        }
        
        $scope.loading.departments = false;
      });      
    }

    function updateConnections() {
      $scope.loading.connections = true;

      DashboardSvc.getConnections().then(function(resp){
        $scope.data.Connections = setRanks(resp, 'Connections');
        $scope.loading.connections = false;
      });
    }

    function updateREI() {
      $scope.loading.rei = true;
      RiskEventSvc.list(moment(), moment().add(-24, 'hours')).then(function(overviewData) {
        $scope.data.REI = overviewData.Result;
        $scope.loading.rei = false;
      });
    }

    function updateActivities() {
      $scope.loading.activities = true;
      DashboardSvc.getActivities().then(function(resp){
        $scope.data.Activities=resp;
        $scope.loading.activities = false;
      });
    }

    function setRanks(values, field) {
      var i;
      values.sort(function(a, b) {
        return b[field].Was - a[field].Was;
      });

      for (i = 0; i < values.length; i++) {
        values[i].Rank = {'Was':i + 1};
      }

      values.sort(function(a, b) {
        return b[field].Now - a[field].Now;
      });

      for (i = 0; i < values.length; i++) {
        values[i].Rank.Now = i + 1;
      }

      return values;
    }
  }]);
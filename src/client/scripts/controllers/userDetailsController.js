(function() {
  'use strict';

  function UserDetailsController($scope, $location, $routeParams, ReportsSvc, RiskEventSvc) {
    // var vm = this;
    $scope.userId = $routeParams.id;
    $scope.loading = {'rei':true, 'overview':true, 'userInfo':true};
    $scope.data = {};


    $scope.isEverithingLoading = function() {
      angular.forEach($scope.loading, function(value) {
        if (!value) {
          return false;
        }
      });

      return true;
    };
    var params = $location.search();
    getUserDetails(params.oid);

    function getUserDetails(officeId) {
      $scope.loading.overview = true;
      $scope.loading.userInfo = true;

      ReportsSvc.getUserDetailsData($scope.userId, officeId).then(function(resp) {
        $scope.data.Info = resp.Info;
        $scope.data.Overview = resp.Overview;
        $scope.data.Activities = resp.Activities;

        $scope.loading.overview = false;
        $scope.loading.userInfo = false;
      });
    }

    $scope.updateREI = function() {
      $scope.loading.rei = true;
      RiskEventSvc.list(moment(), moment().add(-24, 'hours')).then(function(overviewData) {
        $scope.data.REI = overviewData.Result;
        $scope.loading.rei = false;
      });
    };

  }

  UserDetailsController.$inject = [
  '$scope', '$location','$routeParams','ReportsSvc', 'RiskEventSvc'
  ];

  angular.module('theme.core.user_details_controller',[]).controller('UserDetailsController', UserDetailsController);
}).call(this);

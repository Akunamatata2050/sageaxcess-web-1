(function() {
  'use strict';
  angular.module('theme.core.reoi_controller', []).controller('REOICtrl', REOICtrl);


  REOICtrl.$inject = [
  '$scope', '$location', '$http', 'ENV','RiskEventSvc','localStorageService','$rootScope'
  ];

  function REOICtrl($scope, $location, $http, ENV,RiskEventSvc,localStorageService,$rootScope) {

    $scope.range = 'd';
    var summaryDurationInDays = 180;
    $scope.summaryStartDate = moment().add(summaryDurationInDays*-1, 'days');
    $scope.summaryEndDate = moment();
    $scope.dataStartDate = moment().add(-14, 'days');
    $scope.dataEndDate = moment().add(-1, 'days');
    $scope.loadRiskEventData=loadRiskEventData;

    if(localStorageService.get('startDate')){
      $scope.dataStartDate = moment(localStorageService.get('startDate'), 'MM DD YYYY');
      $scope.dataEndDate = moment(localStorageService.get('endDate'), 'MM DD YYYY');
    }

    $scope.$on('userLoaded', function(){      
      $scope.loadRiskEventData($scope.dataStartDate, $scope.dataEndDate);
    }); 

    if($rootScope.loggedInUser) {
      $scope.loadRiskEventData($scope.dataStartDate, $scope.dataEndDate);
    }

    $scope.$on('clientChanged', function(){      
      $scope.loadRiskEventData($scope.dataStartDate, $scope.dataEndDate);
    });

    function loadRiskEventData(dataStartDate, dataEndDate){
      $scope.loading = true;
      $scope.overviewData={};
      $scope.unitData={};
      console.log('Data requested...', new Date());
      RiskEventSvc.list(dataStartDate,dataEndDate).then(function(overviewData) {
        console.log('Data received...', new Date());
        $scope.data = overviewData.Result;
        $scope.loading = false;
        if(overviewData.Data && Object.keys(overviewData.Data).length >0){  

          $scope.overviewData = overviewData;
          console.log($scope.overviewData);

          $scope.unitData = {
            dateStart: overviewData.StartDate,
            dateEnd: overviewData.EndDate
          };

          for (var key in $scope.overviewData.separate) {
            $scope.unitData[key] = $scope.overviewData.separate[key][unitKey].data[0];
          }

          console.log('Data processed...', new Date());  
        }
        buildSummaryData(overviewData.Summary); 
      });
    }    

    $scope.reloadData = function(dataStartDate, dataEndDate){
      $scope.loadRiskEventData(dataStartDate, dataEndDate);
      localStorageService.set('startDate', moment(dataStartDate).format('MM-DD-YYYY'));
      localStorageService.set('endDate', moment(dataEndDate).format('MM-DD-YYYY'));

    };
    function buildSummaryData(summary){
      var data = [];
      for(var i=summaryDurationInDays*-1;i<=-1;i++){
        var dt = moment().add(i, 'days');
        var value = 0;
        var dtStr = dt.format('YYYY-MM-DD');   
        if(summary && summary[dtStr]>0){
          value = summary[dtStr];
        }
        data.push([dt, value]);
      }

      $scope.options = {
        data: data,
        summaryStartDate: $scope.summaryStartDate,
        summaryEndDate: $scope.summaryEndDate,
        dataStartDate: $scope.dataStartDate,
        dataEndDate: $scope.dataEndDate
      };
    }
  }
}).call(this);
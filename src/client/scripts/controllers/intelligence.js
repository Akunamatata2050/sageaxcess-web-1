angular
.module('theme.core.intelligence_controller', [])
.controller('IntelligenceController', ['$scope','localStorageService', 'ReportsSvc', '$location', '$routeParams', 'diagramsSettings', 'OfficesSvc', '$rootScope',function($scope,localStorageService, ReportsSvc, $location, $routeParams, diagramsSettings, OfficesSvc, $rootScope) {
    'use strict';

    var settingsStorage = localStorage || diagramsSettings;

    $scope.diagramType = settingsStorage.intelligenceDiagramType || 'grid';
    $scope.unitChartType = 'area';
    $scope.range = 'm';
    $scope.unitIndex = $routeParams.index;
    $scope.sparklineWidth = 314;
    $scope.chartDataReady=false;
    var unitKey = $location.path().split('/')[2] === 'system' ? 'Systems' : 'Users';

    $scope.range = 'd';
    var summaryDurationInDays = 180;
    $scope.summaryStartDate = moment().add(summaryDurationInDays*-1, 'days');
    $scope.summaryEndDate = moment();
    $scope.dataStartDate = moment().add(-14, 'days');
    $scope.dataEndDate = moment().add(-1, 'days');

    $scope.filters = {};

    $scope.loadActivityData=loadActivityData;
    $scope.getEncodedUsername=getEncodedUsername;
    
    $scope.$on('userLoaded', function(){      
      initialize();
  }); 

    if($rootScope.loggedInUser) {
      initialize();
  }

  $scope.$on('clientChanged', function(){      
      initialize();
  });

  function loadOffices(){
    OfficesSvc.list(999,1,'Name').then(function(resp){
        $scope.offices = resp.Result;
    });
}

if(localStorageService.get('startDate')){
    $scope.dataStartDate=moment(localStorageService.get('startDate'),"MM DD YYYY");
    $scope.dataEndDate=moment(localStorageService.get('endDate'),"MM DD YYYY");
}

function initialize()    {
    loadOffices();
    $scope.$watch('officeId', function(nv,ov){
        if(nv !== ov){              
          $scope.loadActivityData($scope.includeBroadcast,$scope.dataStartDate,$scope.dataEndDate,$scope.officeId);
      }
  });
    $scope.loadActivityData($scope.includeBroadcast,$scope.dataStartDate, $scope.dataEndDate,undefined);
}

function loadActivityData(includeBroadcast,dataStartDate, dataEndDate, officeId){
  $scope.chartDataReady = false;
      // $scope.options={};
      $scope.overviewData={};
      $scope.unitData={};
      console.log('Data requested...', new Date());
      ReportsSvc.getActivityData(undefined,dataStartDate, dataEndDate, includeBroadcast, officeId).then(function(overviewData){
        console.log('Data received...', new Date());
        $scope.overviewData = overviewData;        
        buildSummaryData(overviewData.Summary);
        $scope.chartDataReady = true;
        loadDetailedActivityData(includeBroadcast,dataStartDate, dataEndDate,officeId, undefined, overviewData.Summary);
    });
  }

  function loadDetailedActivityData(includeBroadcast,dataStartDate, dataEndDate,officeId, undefined, summaryData){
      $scope.detailsChartDataReady = false;      
      $scope.overviewData={};
      $scope.unitData={};
      console.log('Data requested...', new Date());
      ReportsSvc.getDetailedActivityData(undefined,dataStartDate, dataEndDate,includeBroadcast, officeId, undefined).then(function(overviewData){
        console.log('Data received...', new Date());
        $scope.overviewData = overviewData;                
        processActivityData(overviewData);
        
        $scope.detailsChartDataReady = true;
    });
  } 

  function processActivityData(overviewData){
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
  }

  $scope.reloadData = function(dataStartDate, dataEndDate){                   
    $scope.loadActivityData($scope.includeBroadcast,dataStartDate, dataEndDate, $scope.officeId);
    localStorageService.set('startDate', moment(dataStartDate).format('MM-DD-YYYY'));
    localStorageService.set('endDate', moment(dataEndDate).format('MM-DD-YYYY'));

    };

    function buildSummaryData(summary){        
    var data = [];
    /*var startDate = angular.copy(vm.summaryStartDate);*/
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


$scope.setDiagramType = function(value) {
    settingsStorage.intelligenceDiagramType = value;
    $scope.diagramType = value;
};

$scope.setStat = function(value) {
    $scope.stat = value;
};

$scope.getActivesUsersCount = function(data){
    if (!data){
        return 0;
    }
    
    var count = data.length;

    var otherExists = _.find(data, function(item) {            
        return item.name.indexOf('Other (') !==-1; 
    });

    return otherExists? count-1:count;
};

$scope.nvd3 = {
    xAxisTickFormat:function(){
        return function(d){
            return d3.time.format('%x')(new Date(d));
        };
    },
    yAxisTickFormat:function(){
        return function(d) {
            return d;
        };
    },
    toolTipContentFunction: function(){
        return function(key, x, y) {
            return  '<div><strong>' + key + '</strong></div>' +
            '<div>' +  y + ' at ' + x + '</div>';
        };
    }
};

function getEncodedUsername(userName){
  return window.encodeURIComponent(userName);
}
}]);
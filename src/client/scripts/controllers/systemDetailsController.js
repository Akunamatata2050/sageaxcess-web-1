(function() {
  'use strict';

  function SystemDetailsController($scope, localStorageService, ReportsSvc, $location, $rootScope, $route) {
    
    var vm = this;
    var unitKey = $location.path().split('/')[2] === 'system' ? 'Systems' : 'Users';
    vm.range = 'm';
    vm.unitChartType = 'area';
    vm.getSparklineValue=getSparklineValue;
    var summaryDurationInDays = 180;
    vm.summaryStartDate = moment().add(-180, 'days');
    vm.summaryEndDate = moment();
    vm.dataStartDate = moment().add(-14, 'days');
    vm.dataEndDate = moment().add(-1, 'days');
    vm.reloadData = reloadData; 
    vm.getEncodedUsername=getEncodedUsername;     

    if(localStorageService.get('startDate')){
        vm.dataStartDate=moment(localStorageService.get('startDate'), 'MM DD YYYY');
        vm.dataEndDate=moment(localStorageService.get('endDate'), 'MM DD YYYY');
    } 

    $scope.$on('userLoaded', function(){
      initialize();
    });

    if($rootScope.loggedInUser) {
      initialize();
    }

    $scope.$on('clientChanged', function(){
      initialize();
    });       

    function initialize(){       
        loadData(vm.dataStartDate, vm.dataEndDate);
    }

    var unitKey = $location.path().split('/')[2] === 'system' ? 'Systems' : 'Users';

    function loadData(dataStartDate, dataEndDate){
      vm.chartDataReady = false;

      vm.overviewData={};
      vm.unitData={};
      var params = $route.current.params;
      console.log('Data requested...', new Date());      
      ReportsSvc.getActivityData(undefined, dataStartDate, dataEndDate, false, undefined, params.index).then(function(overviewData) {        
        console.log('Data received...', new Date());
        $scope.overviewData = overviewData;        
        buildSummaryData(overviewData.Summary);
        vm.chartDataReady = true;
        loadDetailedActivityData(undefined,dataStartDate, dataEndDate,undefined, params.index, overviewData.Summary);
      });
    }

    function loadDetailedActivityData(includeBroadcast,dataStartDate, dataEndDate,officeId, systemId, summaryData){
      vm.detailsChartDataReady = false;      
      $scope.overviewData={};
      vm.unitData={};
      console.log('Data requested...', new Date());
      ReportsSvc.getDetailedActivityData(undefined,dataStartDate, dataEndDate,includeBroadcast, officeId, systemId, summaryData).then(function(overviewData){
        console.log('Data received...', new Date());
        $scope.overviewData = overviewData;    
        var params = $route.current.params;
        processActivityData(overviewData);
        
        vm.detailsChartDataReady = true;
      });
    } 

    function processActivityData(overviewData){
      if(overviewData.Data && Object.keys(overviewData.Data).length >0){            
            $scope.overviewData = overviewData;
            console.log($scope.overviewData);

            vm.unitData = {
                dateStart: overviewData.StartDate,
                dateEnd: overviewData.EndDate
            };

            for (var key in $scope.overviewData.separate) {
                vm.unitData[key] = $scope.overviewData.separate[key][unitKey].data[0];
            }           

            console.log('Data processed...', new Date());            
        }            
        buildSummaryData(overviewData.Summary);
    }
    
    function buildSummaryData(summary){
      var data = [];

      for(var i=summaryDurationInDays*-1;i<=-1;i++){
        var dt = moment().add(i, 'days');
        var value = 0;
        var dtStr = dt.format('YYYY-MM-DD');
        if(summary[dtStr]>0){
            value = summary[dtStr];
        }
        data.push([dt, value]);
      }

      vm.options = {
        data: data,
        summaryStartDate: vm.summaryStartDate,
        summaryEndDate: vm.summaryEndDate,
        dataStartDate: vm.dataStartDate,
        dataEndDate: vm.dataEndDate
      };
    }   

    vm.nvd3 = {
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

    function getSparklineValue(itemAvg, usageAvgMax){
      /*console.log(itemAvg, usageAvgMax);*/
        if (usageAvgMax>0){
            return itemAvg/usageAvgMax;
        } else{
            return 0;
        }
    }

    vm.getActivesUsersCount = function(data){
      if (!data){
        return 0;
      }
    
      var count = data.length;

      var otherExists = _.find(data, function(item) {
        return item.name.indexOf('Other (') !==-1; 
      });

      return otherExists? count-1:count;
    };

    function reloadData(dataStartDate, dataEndDate){
        loadData(dataStartDate, dataEndDate);
        localStorageService.set('startDate', moment(dataStartDate).format('MM-DD-YYYY'));
        localStorageService.set('endDate', moment(dataEndDate).format('MM-DD-YYYY'));
    }

    function getEncodedUsername(userName){
      return window.encodeURIComponent(userName);
    }

  }

  SystemDetailsController.$inject = [
  '$scope','localStorageService', 'ReportsSvc', '$location', '$rootScope', '$route'
  ];

  angular.module('theme.core.system_details_controller',[]).controller('SystemDetailsController', SystemDetailsController);
}).call(this);

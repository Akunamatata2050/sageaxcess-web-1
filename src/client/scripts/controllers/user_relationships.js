(function() {
  'use strict';

  function UserRelationshipsController($location, $route, ReportsSvc, localStorageService) {
    var vm = this;
    var unitKey = $location.path().split('/')[2] === 'system' ? 'Systems' : 'Users';
    vm.range = 'm';
    vm.unitChartType = 'area';
    vm.getSparklineValue=getSparklineValue;

    vm.summaryStartDate = moment().add(-180, 'days');
    vm.summaryEndDate = moment();
    vm.dataStartDate = moment().add(-14, 'days');
    vm.dataEndDate = moment().add(-1, 'days');
    vm.reloadData = reloadData;

    if(localStorageService.get('startDate')){
        vm.dataStartDate=moment(localStorageService.get('startDate'), 'MM DD YYYY');
        vm.dataEndDate=moment(localStorageService.get('endDate'), 'MM DD YYYY');
    } 

    loadData(vm.dataStartDate, vm.dataEndDate);

    function loadData(dataStartDate, dataEndDate){
        vm.chartDataReady=false;
        vm.unitData = {};
        var params = $route.current.params;
        ReportsSvc.getActivityData(params.id, dataStartDate, dataEndDate, undefined, undefined).then(function(userRelationsData){
            console.log('Data received...', userRelationsData);
            vm.userRelationsData = userRelationsData;
            
            buildSummaryData(userRelationsData.Summary);

            vm.chartDataReady=true;
            loadDetailedActivityData(undefined, dataStartDate, dataEndDate, undefined, params.id, userRelationsData.Summary);
        });
    }    

    function loadDetailedActivityData(includeBroadcast,dataStartDate, dataEndDate,officeId, userId, summaryData){
      vm.detailsChartDataReady = false;      
      vm.overviewData={};
      vm.unitData={};
      console.log('Data requested...', new Date());
      ReportsSvc.getDetailedActivityData(userId,dataStartDate, dataEndDate,includeBroadcast, officeId, undefined, summaryData).then(function(overviewData){
        console.log('Data received...', new Date());
        vm.overviewData = overviewData;    
        var params = $route.current.params;
        processActivityData(overviewData);
        
        vm.detailsChartDataReady = true;
      });
    } 

    function processActivityData(overviewData){
      if(overviewData.Data && Object.keys(overviewData.Data).length >0){            
            vm.overviewData = overviewData;
            console.log(vm.overviewData);

            vm.unitData = {
                dateStart: overviewData.StartDate,
                dateEnd: overviewData.EndDate
            };

            for (var key in vm.overviewData.separate) {
                vm.unitData[key] = vm.overviewData.separate[key][unitKey].data[0];
            }           

            console.log('Data processed...', new Date());            
        }            
        buildSummaryData(overviewData.Summary);
    }

    function buildSummaryData(summary){        
        var data = [];        
        for(var i=-180;i<=-1;i++){
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
        console.log(vm.options);
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

    function reloadData(dataStartDate, dataEndDate){
        loadData(dataStartDate, dataEndDate);
    }
}

UserRelationshipsController.$inject = [
'$location', '$route', 'ReportsSvc', 'localStorageService'
];

angular.module('theme.core.user_relationships_controller',[]).controller('UserRelationshipsController', UserRelationshipsController);
}).call(this);
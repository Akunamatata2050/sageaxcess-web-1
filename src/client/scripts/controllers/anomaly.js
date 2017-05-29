angular
.module('theme.core.anomaly_controller', [])
.controller('AnomalyController', ['ReportsSvc','localStorageService', '$scope','$location', 'OfficesSvc', function(ReportsSvc,localStorageService, $scope,$location, OfficesSvc) {
    'use strict';    
    var vm=this;
    vm.chartDataReady=false;
    
    vm.range = 'd';
    var summaryDurationInDays = 180;
    vm.summaryStartDate = moment().add(summaryDurationInDays*-1, 'days');
    vm.summaryEndDate = moment();
        
    vm.dataStartDate = moment().add(-14, 'days');
    vm.dataEndDate = moment().add(-1, 'days');

    OfficesSvc.list(999,1,'Name').then(function(resp){
        vm.offices = resp.Result;
    });

   if(localStorageService.get('startDate')){
        vm.dataStartDate=moment(localStorageService.get('startDate'),"MM DD YYYY");
        vm.dataEndDate=moment(localStorageService.get('endDate'),"MM DD YYYY ");
    }    

    loadData(vm.dataStartDate, vm.dataEndDate);

    $scope.$watch(function(){
        return vm.OfficeID;
    },function(nv,ov){
        if(nv != ov){
            vm.options = undefined;
            loadData(vm.dataStartDate, vm.dataEndDate);
        }
    });
    

    function loadData(dataStartDate, dataEndDate){
        vm.chartDataReady=false;
        if(!dataStartDate || !dataEndDate){
            return;
        }
        ReportsSvc.getAnomalyData(dataStartDate, dataEndDate, vm.OfficeID).then(function(overviewData){
            if(moment(dataStartDate).format('MM-DD-YYYY')===moment(localStorageService.get('startDate'),"MM DD YYYY").format('MM-DD-YYYY')){              
                $scope.overviewData=overviewData;  
            }
            else if(vm.dataStartDate===dataStartDate){
                $scope.overviewData=overviewData;
            }                    
            vm.chartDataReady=true;        
            buildSummaryData(overviewData.Summary);
        });    
    }
    
    $scope.reloadData = function(dataStartDate, dataEndDate){ 
        loadData(dataStartDate, dataEndDate); 
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
}]);
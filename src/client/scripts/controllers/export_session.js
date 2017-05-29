(function() {
  'use strict';

  function ExportSessionCtrl($scope, ENV, SessionService) {
    var vm = this;
    vm.download = download;
    vm.dataToDownload=dataToDownload;
    vm.tableData=[];
    vm.startDate=moment().format('MM/DD/YYYY');
    vm.endDate=moment().format('MM/DD/YYYY');
    vm.validateEndDate = validateEndDate;
    vm.closeAlert = closeAlert;


    vm.tableDetails=[{'TableName':'ftp','Description':'ftp details'},{'TableName':'general','Description':'general details'},
    {'TableName':'http','Description':'http details'},{'TableName':'smb','Description':'smb details'},{'TableName':'smtp','Description':'smtp details'},
    {'TableName':'tds','Description':'tds details'},{'TableName':'dce_rpc','Description':'dce_rpc details'}
    ];

    $scope.open = function($event, element) { 
      $event.preventDefault();
      $event.stopPropagation();
      if(element==='startDt'){
        $scope['endDt'] = {'opened': false};
      }else{
        $scope['startDt'] = {'opened': false};
      }
      $scope[element].opened = true;
    };

    $scope.formats = ['MM/dd/yyyy'];
    $scope.format = $scope.formats[0];

    $scope.startDt = {
      opened: false
    };
    $scope.endDt = {
      opened: false
    };

    function dataToDownload(tableName){
      var data =_.find(vm.tableData, function(item){ return item === tableName;});

      if(data){
        var index=vm.tableData.indexOf(data);
        vm.tableData.splice(index,1);
      }else{
        vm.tableData.push(tableName);
      }

      if(vm.tableData.length >=1 ){
        vm.isEnable = true;
      }else{
        vm.isEnable = false;
      }
    }

    function validateEndDate(){
      return moment(vm.startDate).isAfter(moment(vm.endDate));
    }

    function closeAlert(index){
      vm.invalidDateAlerts.splice(index, 1);
    }

    function download() {
      if(validateEndDate()){
        vm.invalidDateAlerts = [{'msg':'The selected end date is earlier than selected start date','type':'danger'}];
      }
      if(!validateEndDate()){
        vm.dataExport=[];
        var selectedStrtDate = moment(vm.startDate).format('MM-DD-YYYY');
        var selectedEndDate = moment(vm.endDate).format('MM-DD-YYYY');
        var data = angular.copy(vm.tableData);
        vm.dataExport.push(data, selectedStrtDate, selectedEndDate);

        vm.startDate = undefined;
        vm.endDate = undefined;
        window.open(ENV.apiEndpoint + '/data-export/' + '?token=' + encodeURIComponent(SessionService.getToken().value.split(' ')[1]) + '&tables=' + data.join(',') + '&startDate=' + selectedStrtDate + '&endDate=' + selectedEndDate );
      }
    }    

  }
  ExportSessionCtrl.$inject = ['$scope','ENV', 'SessionService'];
  angular.module('theme.core.main_controller').controller('ExportSessionCtrl', ExportSessionCtrl);

}).call(this);

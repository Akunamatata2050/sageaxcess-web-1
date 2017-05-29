(function() {
  'use strict';
  angular.module('theme.core.messages_controller').controller('UnknownFilePathListCtrl', UnknownFilePathCtrl);

  UnknownFilePathCtrl.$inject = [
  '$scope', '$location', '$route', 'UnknownFilePathSvc', 'dialogs', '$filter', '$rootScope'
  ];

  function UnknownFilePathCtrl($scope, $location, $route, UnknownFilePathSvc, dialogs, $filter, $rootScope) {
    var vm = this;

    vm.getUnknownFilePaths = getUnknownFilePaths;
    vm.edit = edit;
    vm.order=order;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Timestamp';
    vm.removeUnknownFilePath=removeUnknownFilePath;
    getUnknownFilePaths(); 

    function getUnknownFilePaths() {
      UnknownFilePathSvc.list(vm.itemsPerPage, vm.currentPage,vm.sortcolumn, vm.searchKeywords).then(function(resp) {

        vm.unknownFilePaths = resp;

        vm.filteredunknownFilePaths = angular.copy(vm.unknownFilePaths);
        $rootScope.notifyInitialization();
      });
    }   

    function edit(unknownFilePath) {
      $location.path('unknown_file_paths/' + unknownFilePath.EntityID);
    }
    function order(rowName) {
      if (vm.sortcolumn === rowName || vm.sortcolumn === '-' + rowName) {
        if (vm.sortcolumn.startsWith('-')) {
          vm.sortcolumn = vm.sortcolumn.replace('-', '');
        } else {
          vm.sortcolumn = '-' + vm.sortcolumn;
        }
      } else {
        vm.sortcolumn = rowName;
      }

      getUnknownFilePaths();
    }

    $scope.$watch(function(){
      return vm.searchKeywords;
    }, function(nv,ov){
      if(nv !== ov){
        vm.currentPage=1;
        getUnknownFilePaths();
      }
    });

    function removeUnknownFilePath(unknownFilePath) {
      var dlg;
      dlg = dialogs.confirm('Remove "' + unknownFilePath.Path + '" Unknown File Path?', '');
      dlg.result.then(function() {
        UnknownFilePathSvc.remove(unknownFilePath.EntityID).then(function() {
          getUnknownFilePaths();
        });
      });
    }

    $scope.$watch(function(){
      return vm.deleteAll;
    }, function(nv,ov){
      if(nv && nv!==ov){
       var dlg;
       if(vm.unknownFilePaths.Result.length>=1){
        dlg = dialogs.confirm('Confirm that you would like to remove all Unknown File Paths.', '');
       }else{
        dlg = dialogs.confirm('Table is empty', '');
       }
       dlg.result.then(function() {
         UnknownFilePathSvc.remove().then(function() {
          vm.deleteAll = false;
          getUnknownFilePaths();
        });
       }, function(){
        vm.deleteAll = false;
       });       
     }
   });
  }
}).call(this);
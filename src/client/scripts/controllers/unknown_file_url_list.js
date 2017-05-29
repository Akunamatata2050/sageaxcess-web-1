(function() {
  'use strict';
  angular.module('theme.core.messages_controller').controller('UnknownFileUrlListCtrl', UnknownFileUrlCtrl);

  UnknownFileUrlCtrl.$inject = [
  '$scope', '$location', '$route', 'UnknownFileUrlSvc', 'dialogs', '$filter', '$rootScope'
  ];

  function UnknownFileUrlCtrl($scope, $location, $route, UnknownFileUrlSvc, dialogs, $filter, $rootScope) {
    var vm = this;
    vm.getUnknownFileUrls = getUnknownFileUrls;
    vm.edit = edit;
    vm.order=order;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Timestamp';
    vm.removeUnknownFileUrl = removeUnknownFileUrl;
    getUnknownFileUrls();      

    function getUnknownFileUrls() {
     UnknownFileUrlSvc.list(vm.itemsPerPage, vm.currentPage,vm.sortcolumn, vm.searchKeywords).then(function(resp) {
      vm.unknownFileUrls = resp;      
      vm.filteredunknownFileUrls = angular.copy(vm.unknownFileUrls);
      $rootScope.notifyInitialization();      
    });
   }   
   
   function edit(unknownFileUrls) {
    $location.path('unknown_file_url/' + unknownFileUrls.EntityID);
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

  getUnknownFileUrls();
}

$scope.$watch(function(){
  return vm.searchKeywords;
}, function(nv,ov){
  if(nv !== ov){
    vm.currentPage=1;
    getUnknownFileUrls();
  }
});

$scope.$watch(function(){
  return vm.deleteAll;
}, function(nv,ov){
  if(nv && nv!==ov){
   var dlg;
   if(vm.unknownFileUrls.Result.length>=1){
    dlg = dialogs.confirm('Confirm that you would like to remove all Unknown File URLs.', '');
  }else{
    dlg = dialogs.confirm('Table is empty', '');
  }
   dlg.result.then(function() {
     UnknownFileUrlSvc.remove().then(function() {
      vm.deleteAll = false;
      getUnknownFileUrls();
    });
   }, function(){
    vm.deleteAll = false;
  });       
 }
});

function removeUnknownFileUrl(unknownFileUrl) {
  var dlg;
  dlg = dialogs.confirm('Remove "' + unknownFileUrl.Url + '" Unknown File URL?', '');
  dlg.result.then(function() {
    UnknownFileUrlSvc.remove(unknownFileUrl.EntityID).then(function() {
      getUnknownFileUrls();
    });
  });
}

}
}).call(this);
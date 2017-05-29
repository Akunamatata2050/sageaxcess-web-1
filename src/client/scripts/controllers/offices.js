(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('OfficesCtrl', OfficesCtrl);


  OfficesCtrl.$inject = [
  '$scope', '$location', '$route', 'OfficesSvc', 'dialogs', '$rootScope'
  ];

  function OfficesCtrl($scope, $location, $route, OfficesSvc, dialogs, $rootScope) {

    var original,vm = this;

    vm.getOffices = getOffices;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.edit = edit;
    vm.order=order;
    vm.removeOffice=removeOffice;
    vm.save = save;
    vm.closeAlert=closeAlert;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Name';

    getOffices();

    function getOffices() {

      var params;
      params = $route.current.params;
      if (!params.id) {
        OfficesSvc.list(vm.itemsPerPage, vm.currentPage, vm.sortcolumn, vm.searchKeywords).then(function(resp) {
          vm.offices = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        OfficesSvc.get(params.id).then(function(resp) {
          if(!resp.Active){
            $location.path('/admin/offices');
          }
          vm.office = resp;
          original = angular.copy(resp);
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.office = {};
        $rootScope.notifyInitialization();
      }
    }
   

    function canRevert() {
      return !angular.equals(vm.office, original) || !$scope.officeForm.$pristine;
    }

    function canSubmit() {
      return $scope.officeForm && $scope.officeForm.$valid && !angular.equals(vm.office, original);
    }


    function isCreate() {
     if (vm.office.EntityID) {
      return false;
    } else {
      return true;
    }
  }
  function edit(office) {

   return $location.path('/admin/offices/' + office.EntityID);
 }


 function save() {
  vm.saving = true;
  vm.alerts=[];
  OfficesSvc.save(vm.office).then(function(resp) {
    vm.saving = false;
    if(resp.error && resp.errorCode === 800){
      vm.alerts = [{'msg': 'An office exists with this name. Please use a different name.', 'type': 'danger'}];
    } else{
      $location.path('/admin/offices');  
    }
    
  });
}

function closeAlert(index) {
vm.alerts.splice(index, 1);
}

function removeOffice() {
  var dlg;
  dlg = dialogs.confirm('Remove "' + original.Name + '" Office?', '');
  dlg.result.then(function() {

    OfficesSvc.remove(vm.office.EntityID).then(function() {

      $location.path('/admin/offices');
    });
  });
}

$scope.$watch(function(){
  return vm.searchKeywords;
}, function(nv,ov){
  if(nv !== ov){
    vm.currentPage=1;
    getOffices();
  }
});

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

getOffices();
}
}
}).call(this);
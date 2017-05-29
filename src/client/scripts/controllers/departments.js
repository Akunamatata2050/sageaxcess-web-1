(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('DepartmentsCtrl', DepartmentsCtrl);


  DepartmentsCtrl.$inject = [
  '$scope', '$location', '$route', 'DepartmentsSvc', 'dialogs', '$rootScope'
  ];

  function DepartmentsCtrl($scope, $location, $route, DepartmentsSvc, dialogs, $rootScope) {

    var original,vm = this;

    vm.getDepartments = getDepartments;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.edit = edit;
    vm.order=order;
    vm.removeDepartment=removeDepartment;
    vm.closeAlert=closeAlert;
    vm.save = save;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Name';

    getDepartments();

    function getDepartments() {

      var params;
      params = $route.current.params;
      if (!params.id) {
        DepartmentsSvc.list(vm.itemsPerPage, vm.currentPage, vm.sortcolumn, vm.searchKeywords).then(function(resp) {
          vm.departments = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        DepartmentsSvc.get(params.id).then(function(resp) {
          if(!resp.Active){
            gotoListPage();
          }
          vm.department = resp;
          original = angular.copy(resp);
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.department = {};
        $rootScope.notifyInitialization();
      }
    }
    original = angular.copy(vm.department);

    function canRevert() {
      return !angular.equals(vm.department, original) || !$scope.departmentForm.$pristine;
    }

    function canSubmit() {
      return $scope.departmentForm && $scope.departmentForm.$valid && !angular.equals(vm.department, original);
    }


    function isCreate() {
     if (vm.department.EntityID) {
      return false;
    } else {
      return true;
    }
  }
  function edit(department) {

   return $location.path('/admin/departments/' + department.EntityID);
 }


 function save() {
  vm.saving = true;
  vm.alerts=[];
  DepartmentsSvc.save(vm.department).then(function(resp) {
    vm.saving = false;
    if(resp.error && resp.errorCode === 900){
      vm.alerts = [{'msg': 'A department exists with this name. Please use a different name.', 'type': 'danger'}];
    } else{
      gotoListPage();
    }
  });
}

function closeAlert(index) {
 vm.alerts.splice(index, 1);
}

function removeDepartment() {
  var dlg;
  dlg = dialogs.confirm('Remove "' + original.Name + '" Department?', '');
  dlg.result.then(function() {

    DepartmentsSvc.remove(vm.department.EntityID).then(function() {

      gotoListPage();
    });
  });
}

$scope.$watch(function(){
  return vm.searchKeywords;
}, function(nv,ov){
  if(nv !== ov){
    vm.currentPage=1;
    getDepartments();
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

getDepartments();
}

function gotoListPage(){
 $location.path('/admin/departments'); 
}
}
}).call(this);
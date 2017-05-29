(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('PathExpressionsCtrl', PathExpressionsCtrl);

  PathExpressionsCtrl.$inject = [
  '$scope', '$location', '$route', 'PathExpressionsSvc', 'dialogs', '$rootScope'
  ];

  function PathExpressionsCtrl($scope, $location, $route, PathExpressionsSvc, dialogs, $rootScope) {
    var original, vm = this;
    vm.getPathExpressions = getPathExpressions;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.edit = edit;
    vm.order=order;
    vm.removePathExpressions = removePathExpressions;
    vm.save = save;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Expression';
    vm.selectRow = selectRow;

    getPathExpressions();

    function getPathExpressions() {
      var params;
      params = $route.current.params;
      
      if (!params.id) {

        PathExpressionsSvc.list(vm.itemsPerPage, vm.currentPage, vm.sortcolumn, vm.searchKeywords).then(function(resp) {
          vm.pathExpressions = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        PathExpressionsSvc.get(params.id).then(function(resp) {
          if(!resp.Active){
            gotoListPage();
          }
          vm.pathExpression = resp;
          vm.originalPathExpression = resp.Expression;
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.pathExpression = {};
        $rootScope.notifyInitialization();
      }
    }

    original = angular.copy(vm.pathExpressions);

    function canRevert() {
      return !angular.equals(vm.pathExpressions, original) || !$scope.pathExpressionsForm.$pristine;
    }

    function canSubmit() {
      return $scope.unknownFilePathForm && $scope.pathExpressionsForm.$valid && !angular.equals(vm.pathExpressions, original);
    }

    function isCreate() {

      if (vm.pathExpression.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function save() {

      vm.saving = true;
      PathExpressionsSvc.save(vm.pathExpression).then(function() {
        vm.saving = false;
        gotoListPage();
      });
    }

    function edit(pathExpression) {
      return $location.path('/path_expressions/' + pathExpression.EntityID);
    }

    function removePathExpressions() {
      var dlg;
      dlg = dialogs.confirm('Remove "' + vm.originalPathExpression + '" Path Expression?', '');
      dlg.result.then(function() {
        PathExpressionsSvc.remove(vm.pathExpression.EntityID).then(function() {
          gotoListPage();
        });
      });
    }

    $scope.$watch(function(){
      return vm.searchKeywords;
    }, function(nv,ov){
      if(nv !== ov){
        vm.currentPage=1;
        getPathExpressions();
      }
      vm.selectedExpression=undefined;
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

    getPathExpressions();
  }
  function selectRow(pathexpression){    
    if(vm.selectedExpression && vm.selectedExpression.EntityID === pathexpression.EntityID) {
      vm.selectedExpression = undefined;
    }else{
      vm.selectedExpression = pathexpression;
    }
  }

  function gotoListPage(){
    $location.path('/path_expressions');
  }
}

}).call(this);
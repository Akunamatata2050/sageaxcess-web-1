(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('UrlExpressionsCtrl', UrlExpressionsCtrl);

  UrlExpressionsCtrl.$inject = [
  '$scope', '$location', '$route', 'UrlExpressionsSvc', 'dialogs', '$rootScope'
  ];

  function UrlExpressionsCtrl($scope, $location, $route, UrlExpressionsSvc, dialogs, $rootScope) {
    var original, vm = this;
    vm.getUrlExpressions = getUrlExpressions;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.edit = edit;
    vm.order=order;
    vm.removeUrlExpressions = removeUrlExpressions;
    vm.save = save;
    vm.itemsPerPage = 10;
    vm.currentPage = 1;
    vm.sortcolumn = 'Expression';
    vm.selectRow = selectRow;

    getUrlExpressions();

    function getUrlExpressions() {
      var params;
      params = $route.current.params;
      if (!params.id) {
        UrlExpressionsSvc.list(vm.itemsPerPage, vm.currentPage, vm.sortcolumn, vm.searchKeywords).then(function(resp) {
          vm.urlExpressions = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        UrlExpressionsSvc.get(params.id).then(function(resp) {
          if(!resp.Active){
            gotoListPage();
          }
          vm.urlExpression = resp;
          vm.originalUrlExpression = resp.Expression;
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.urlExpression = {};
        $rootScope.notifyInitialization();
      }
    }

    original = angular.copy(vm.urlExpressions);

    function canRevert() {
      return !angular.equals(vm.urlExpressions, original) || !$scope.urlExpressionsForm.$pristine;
    }

    function canSubmit() {
      return $scope.unknownFileUrlForm && $scope.urlExpressionsForm.$valid && !angular.equals(vm.urlExpressions, original);
    }

    function isCreate() {

      if (vm.urlExpression.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function save() {

      vm.saving = true;
      UrlExpressionsSvc.save(vm.urlExpression).then(function() {
        vm.saving = false;
        gotoListPage();
      });
    }

    function edit(urlExpression) {
      return $location.url('/url_expressions/' + urlExpression.EntityID);
    }

    function removeUrlExpressions() {
      var dlg;
      dlg = dialogs.confirm('Remove "' + vm.originalUrlExpression + '" URL Expression?', '');
      dlg.result.then(function() {
        UrlExpressionsSvc.remove(vm.urlExpression.EntityID).then(function() {
          gotoListPage();
        });
      });
    }

    $scope.$watch(function(){
      return vm.searchKeywords;
    }, function(nv,ov){
      if(nv !== ov){
        vm.currentPage=1;
        getUrlExpressions();
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

    getUrlExpressions();
  }

  function selectRow(urlexpression){   
    if(vm.selectedExpression && vm.selectedExpression.EntityID === urlexpression.EntityID) {
      vm.selectedExpression = undefined;
    }else{
      vm.selectedExpression = urlexpression;
    }
  }

  function gotoListPage(){
    $location.path('/url_expressions');
  }
}

}).call(this);
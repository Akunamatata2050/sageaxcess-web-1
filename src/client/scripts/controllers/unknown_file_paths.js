(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('EditUnknownFilePathCtrl', EditUnknownFilePathCtrl);

  EditUnknownFilePathCtrl.$inject = [
    '$scope', '$location', '$route', 'UnknownFilePathSvc', 'dialogs', '$rootScope'
  ];

  function EditUnknownFilePathCtrl($scope, $location, $route, UnknownFilePathSvc, dialogs, $rootScope) {
    var original, vm = this;

    vm.getUnknownFilePaths = getUnknownFilePaths;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.updateUnknownFilePath = updateUnknownFilePath;
    vm.edit = edit;
    vm.removeUnknownFilePath = removeUnknownFilePath;
    vm.save = save;

    getUnknownFilePaths();

    function getUnknownFilePaths() {

      var params;
      params = $route.current.params;
      if (!params.id) {
        UnknownFilePathSvc.list().then(function(resp) {
          vm.unknownFilePaths = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        UnknownFilePathSvc.get(params.id).then(function(resp) {
          vm.unknownFilePath = resp;
          original = angular.copy(resp);
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.unknownFilePath = {};
        $rootScope.notifyInitialization();
      }
    }

    function canRevert() {
      return !angular.equals(vm.unknownFilePaths, original) || !$scope.unknownFilePathForm.$pristine;
    }

    function canSubmit() {
      return $scope.unknownFilePathForm && $scope.unknownFilePathForm.$valid && !angular.equals(vm.unknownFilePaths, original);
    }

    function isCreate() {
      if (vm.unknownFilePaths.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function updateUnknownFilePath(unknownFilePath) {
      UnknownFilePathSvc.update(unknownFilePath).then(function() {
        vm.getUnknownFilePaths();
      });
    }

    function save() {
      vm.saving = true;
      UnknownFilePathSvc.save(vm.unknownFilePath).then(function() {
        vm.saving = false;
        $location.path('/unknown_file_paths');
      });
    }

    function edit(unknownFilePath) {
      return $location.path('/unknown_file_paths' + unknownFilePath.EntityID);
    }

    function removeUnknownFilePath() {
      var dlg;
      dlg = dialogs.confirm('Remove "' + original.Path + '" Unknown File Path?', '');
      dlg.result.then(function() {
        UnknownFilePathSvc.remove(vm.unknownFilePath.EntityID).then(function() {
          $location.path('/unknown_file_paths');
        });
      });
    }
  }

}).call(this);
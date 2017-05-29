(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('EditUnknownFileUrlCtrl', EditUnknownFileUrlCtrl);

  EditUnknownFileUrlCtrl.$inject = [
    '$scope', '$location', '$route', 'UnknownFileUrlSvc', 'dialogs', '$rootScope'
  ];

  function EditUnknownFileUrlCtrl($scope, $location, $route, UnknownFileUrlSvc, dialogs, $rootScope) {
    var original, vm = this;

    vm.getUnknownFileUrls = getUnknownFileUrls;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.updateUnknownFileUrl = updateUnknownFileUrl;
    vm.edit = edit;
    vm.removeUnknownFileUrl = removeUnknownFileUrl;
    vm.save = save;

    getUnknownFileUrls();

    function getUnknownFileUrls() {

      var params;
      params = $route.current.params;
      if (!params.id) {
        UnknownFileUrlSvc.list().then(function(resp) {
          vm.unknownFileUrls = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        UnknownFileUrlSvc.get(params.id).then(function(resp) {

          vm.unknownFileUrl = resp;
          original = angular.copy(resp);
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.unknownFileUrl = {};
        $rootScope.notifyInitialization();
      }
    }

    function canRevert() {
      return !angular.equals(vm.unknownFileUrl, original) || !$scope.unknownFileUrlForm.$pristine;
    }

    function canSubmit() {
      return $scope.unknownFileUrlForm && $scope.unknownFileUrlForm.$valid && !angular.equals(vm.unknownFileUrl, original);
    }

    function isCreate() {
      if (vm.unknownFileUrl.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function updateUnknownFileUrl(unknownFileUrl) {
      UnknownFileUrlSvc.update(unknownFileUrl).then(function() {
        vm.getUnknownFileUrls();
      });
    }

    function save() {
      vm.saving = true;
      UnknownFileUrlSvc.save(vm.unknownFileUrl).then(function() {
        vm.saving = false;
        $location.path('/unknown_file_url');
      });
    }

    function edit(unknownFileUrl) {
      return $location.path('/unknown_file_url' + unknownFileUrl.EntityID);
    }

    function removeUnknownFileUrl() {
      var dlg;
      dlg = dialogs.confirm('Remove "' + original.Url + '" Unknown File Url?', '');
      dlg.result.then(function() {
        UnknownFileUrlSvc.remove(vm.unknownFileUrl.EntityID).then(function() {
          $location.path('/unknown_file_url');
        });
      });
    }    
  }

}).call(this);
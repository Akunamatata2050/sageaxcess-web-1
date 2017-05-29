(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('ClientsCtrl', ClientsCtrl);

  ClientsCtrl.$inject = [
    '$scope', '$location', '$route', 'ClientsSvc', 'dialogs', '$rootScope'
  ];

  function ClientsCtrl($scope, $location, $route, ClientsSvc, dialogs, $rootScope) {
    var original, vm = this;

    vm.getClients = getClients;
    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.updateClient = updateClient;
    vm.edit = edit;
    vm.removeClient = removeClient;
    vm.save = save;

    getClients();

    function getClients() {
      var params;
      params = $route.current.params;
      if (!params.id) {
        ClientsSvc.list().then(function(resp) {
          vm.clients = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        ClientsSvc.get(params.id).then(function(resp) {
          vm.client = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        $scope.client = {};
        $rootScope.notifyInitialization();
      }
    }

    original = angular.copy(vm.client);

    function canRevert() {
      return !angular.equals(vm.client, original) || !$scope.clientForm.$pristine;
    }

    function canSubmit() {
      return $scope.clientForm && $scope.clientForm.$valid && !angular.equals(vm.client, original);
    }

    function isCreate() {
      if (vm.client.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function updateClient(client) {
      ClientsSvc.update(client).then(function() {
        vm.getClients();
      });
    }

    function save() {
      vm.saving = true;
      ClientsSvc.save(vm.client).then(function() {
        vm.saving = false;
        $location.path('/admin/clients');
      });
    }

    function edit(client) {
      return $location.path('/admin/clients/' + client.EntityID);
    }

    function removeClient() {
      var dlg;
      dlg = dialogs.confirm('Remove "' + vm.client.Name + '" Client?', '');
      dlg.result.then(function() {
        ClientsSvc.remove(vm.client.EntityID).then(function() {
          $location.path('/admin/clients');
        });
      });
    }
  }


}).call(this);
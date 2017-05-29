(function() {
  'use strict';

  function ResetPasswordCtrl($scope, UsersSvc, UI) {
    var vm = this;

    vm.data = {
      'Email': ''
    };
    vm.confirmation = false;
    vm.resetPassword = resetPassword;
    vm.closeAlert=closeAlert;
    vm.canSubmit = canSubmit;

    function resetPassword(event, isInvalid, form) {
      if (isInvalid) {
        form.$setDirty();
        UI.shake(event.target);
      }
      else {
        vm.saving=true;
        UsersSvc.resetPassword(vm.data).then(function() {
          vm.alerts = [];
          vm.confirmation = true;
        }, function() {
          vm.saving=false;
          vm.alerts = [];
          vm.alerts.push({
            'msg': 'Invalid email.',
            'type': 'danger'
          });
        });
      }
    }

    function closeAlert(index) {
      vm.alerts.splice(index, 1);
    }

    function canSubmit() {
      return $scope.resetPwdForm.$valid;
    }
  }
  ResetPasswordCtrl.$inject = ['$scope', 'UsersSvc', 'UI'];

  angular.module('theme.core.main_controller').controller('ResetPasswordCtrl', ResetPasswordCtrl);

}).call(this);
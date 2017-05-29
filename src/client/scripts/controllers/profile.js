(function() {
  'use strict';

  function ProfileCtrl($scope,$modalInstance, profile, SessionService,deviceDetector, $rootScope, OfficesSvc, DepartmentsSvc, notificationService) {
    var vm = this;
    vm.originalUser = angular.copy(profile);
    vm.user = angular.copy(profile);
    vm.ok = ok;
    vm.closeAlert=closeAlert;
    vm.cancel = cancel;
    vm.canSubmit = canSubmit;

    OfficesSvc.list(999,1,'Name').then(function(resp){
      vm.offices = resp.Result;
    });

    DepartmentsSvc.list(999,1,'Name').then(function(resp){
      vm.departments = resp.Result;
    });

    //TODO: Need generic solution that works for all browsers.
      if(deviceDetector.browser==='safari' || deviceDetector.browser==='chrome'){
      $scope.isChromeOrSafari=true;
    }else{
      $scope.isChromeOrSafari=false;
    }

    function ok() {
      vm.saving=true;
      vm.chgProfileAlerts=[];
      SessionService.updateProfile(vm.user).then(function(user) {
        $rootScope.loggedInUser = user;
        vm.saving=false;
        $modalInstance.close(vm.user);        
        notificationService.success('Profile updated successfully!');
        $rootScope.$broadcast('updatedUsersList');
      }, function(error){
        vm.saving=false;
        if(error.data && error.data.errorCode && error.data.errorCode === 601){

          vm.chgProfileAlerts = [{
            type: 'danger',
            msg: 'form.profile.error_messages.invalid_current_password_msg'
          }];    
        } else if(error.data && error.data.errorCode && error.data.errorCode === 600){

          vm.chgProfileAlerts = [{'type':'danger', 'msg': 'User already exists with email. Please use a different email.'}];    
        }else{
          vm.chgProfileAlerts = [{
            type: 'danger',
            msg: 'Unknown error occured, please try again.'
          }];
        }
      });   
    }

    function canSubmit() {
      return $scope.userForm && $scope.userForm.$valid && !angular.equals(vm.user, vm.originalUser);
    }

    function cancel() {
      $modalInstance.dismiss('cancel');
    }

    function closeAlert(index){
      vm.chgProfileAlerts.splice(index,1);
    }
  }

  ProfileCtrl.$inject = ['$scope','$modalInstance', 'profile','SessionService','deviceDetector', '$rootScope', 'OfficesSvc', 'DepartmentsSvc', 'notificationService'];
  angular.module('theme.core.main_controller').controller('ProfileCtrl', ProfileCtrl);

}).call(this);
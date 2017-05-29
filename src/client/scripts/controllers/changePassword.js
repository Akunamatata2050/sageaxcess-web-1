(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('ChangePasswordCtrl', [
    '$scope', '$modalInstance', '$cookies', '$cookieStore','deviceDetector', 'UsersSvc', 'profile', '$rootScope', 'notificationService','localStorageService',
    function($scope, $modalInstance, $cookies, $cookieStore,deviceDetector, UsersSvc, profile, $rootScope, notificationService, localStorageService) {
      $scope.user = profile;
      $scope.data = {
        'UserAccountID': profile.UserAccountID
      };

      //TODO: Need generic solution that works for all browsers.
      if(deviceDetector.browser==='safari' || deviceDetector.browser==='chrome'){
      $scope.isChromeOrSafari=true;
    }else{
      $scope.isChromeOrSafari=false;
    }

      $scope.resetToken = localStorageService.get('reset_token');
      if($scope.resetToken){
        $scope.data.CurrentPassword = $scope.resetToken;
      }

      function isValidPassword(password){
        var expression = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
        return expression.test(password);
      }

      $scope.ok = function() {
        $scope.chgPwdAlerts = [];
        if ($scope.data.ConfirmPassword === $scope.data.NewPassword) {
          if(isValidPassword($scope.data.NewPassword)){
            if($scope.data.CurrentPassword===$scope.data.NewPassword){
              $scope.chgPwdAlerts = [{
              type: 'danger',
              msg: 'form.change_password.error_messages.password_mismatch'
            }];
            }
            else{ 
            changePassword();
            }
          } else{
            $scope.chgPwdAlerts = [{
              type: 'danger',
              msg: 'form.change_password.error_messages.password_policy'
            }];  
          }          
        } else {
          $scope.chgPwdAlerts = [{
            type: 'danger',
            msg: 'form.change_password.error_messages.password_mismatch_msg'
          }];
        }
      };

      function changePassword(){
        UsersSvc.changePassword($scope.data).then(function() {
          $modalInstance.close();
          $rootScope.notifyInitialization();
          notificationService.success('Password changed successfully!');
          localStorageService.set('reset_token',undefined);
          $rootScope.$broadcast('getUser');
        }, function(error){
          if(error.data && error.data.errorCode && error.data.errorCode === 601){
            $scope.chgPwdAlerts = [{
              type: 'danger',
              msg: 'form.change_password.error_messages.invalid_current_password_msg'
            }];    
          }else{
            $scope.chgPwdAlerts = [{
              type: 'danger',
              msg: 'Unknown error occured, please try again.'
            }];
          }
        });
      }

      $scope.cancel = function() {
        UsersSvc.cancelPasswordChange($scope.data).then(function() {
         $modalInstance.dismiss('cancel'); 
        });        
      };

      $scope.closeAlert = function(index){
        $scope.chgPwdAlerts.splice(index,1);
      };
    }
    ]);

}).call(this);
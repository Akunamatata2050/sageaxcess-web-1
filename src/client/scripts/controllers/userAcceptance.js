(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('UserAcceptanceCtrl', [
    '$scope', '$modalInstance', 'profile', '$rootScope', 'SessionService',
    function($scope, $modalInstance, profile, $rootScope, SessionService) {

      var vm=this;
      vm.save=save;
      vm.contentViewed=false;
      vm.updateContentViewed=function(){        
        vm.contentViewed=true;
      }; 

      function save(){      
        var user = angular.copy($rootScope.loggedInUser);
        user.IsAcceptedLicense=true;
        SessionService.updateProfile(user).then(function(resp) {
          $modalInstance.close();
        });   
      }     
    }
    ]);

}).call(this);
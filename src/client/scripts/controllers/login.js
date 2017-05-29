(function() {
  'use strict';

  function LoginCtrl($scope, $location, SessionService, localStorageService, $theme, $route, $window, $timeout, UI, $rootScope, $routeParams) {
    var vm = this;
    vm.getUserName = getUserName;   

    if (!SessionService.isAuthorized()) {
      $theme.set('fullscreen', true);
    }

    vm.data = {'username': getUserName($routeParams.un), 'password': $routeParams.token};

    vm.login = login;
    vm.closeAlert = closeAlert;

    if(vm.data.username && vm.data.password && vm.data.username.length>0 && vm.data.password.length>0){
      vm.data.IsResetLink = true;
      login();
    }

    function getUserName(name){
      var userName = name;

      if(name && window.atob(name)){
        //decodes the user name
        userName =  window.atob(name);
      }else{
        userName = $routeParams.un;
      }

      return userName
    }

    function login(event, form) { 
      vm.saving=true;       
      if(form){
        form.$setDirty();  
        form.username.$setDirty();
        form.passwd.$setDirty();
      }
      
      if (form && form.$invalid) {
       vm.saving=false;  
       UI.shake(event.target);
     }
     else {  
      vm.passwordResetTokenExpired = false;
      SessionService.login(vm.data, loginHandler, errorHandler);
    }

  }

  function closeAlert(index) {
    vm.alerts.splice(index, 1);
  }

  function loginHandler(resp) { 
    vm.saving=false;     
    if (SessionService.isAuthorized()) {
      var resetToken = $location.search().token;

      if(resetToken && resetToken.length>0){
        localStorageService.set('reset_token', resetToken);          
      }
      $location.search('un', undefined);
      $location.search('token', undefined);
      $theme.set('fullscreen', false);
      $scope.$emit('getUser');
      var requestedPath = localStorageService.get('requested_path');
      if (requestedPath && !isPublicPage(requestedPath)) {       
        $location.path(requestedPath);
      } else {
        $location.path('/dashboard');
      }
    } else {
      vm.alerts = [];
      if(resp.error && resp.errorCode === 602){
        vm.passwordResetTokenExpired = true;
        vm.alerts.push({
          'msg': 'Password reset token expired!',
          'type': 'danger'
        });  
      } else{
        vm.alerts.push({
          'msg': 'Invalid username or password!',
          'type': 'danger'
        });
      }        
    }
  }

  function isPublicPage(requestedPath){
    if (requestedPath === ('/pages/signin/' || '/pages/signup/' || '/pages/forgot-password/')){
      return true;
    }else{
      return false;
    }
  }

  function errorHandler() {
    vm.saving=false;
    vm.alerts = [];
    vm.alerts.push({
      'msg': 'Invalid username or password!',
      'type': 'danger'
    });
  }    
}

angular.module('theme.core.main_controller').controller('LoginCtrl', LoginCtrl);

LoginCtrl.$inject = [
'$scope', '$location', 'SessionService', 'localStorageService', '$theme', '$route', '$window', '$timeout', 'UI', '$rootScope', '$routeParams'
];

}).call(this);
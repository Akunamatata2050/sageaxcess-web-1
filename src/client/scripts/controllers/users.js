(function() {
  'use strict';

  function UsersCtrl($scope, $location, $route, UsersSvc, dialogs, $rootScope) {
    var vm = this;
    var original;

    $scope.$on('userLoaded', function(){      
      initialize();
    }); 

    if($rootScope.loggedInUser) {
      initialize();
    }

    $scope.$on('clientChanged', function(){      
      initialize();
    });

    function initialize(){
      getUsers();  
    }
    

    vm.canRevert = canRevert;
    vm.canSubmit = canSubmit;
    vm.isCreate = isCreate;
    vm.save = save;
    vm.removeUser = removeUser;
    vm.closeAlert=closeAlert;
    vm.selectRow = selectRow;
    vm.editUser=editUser;
    
    vm.permissions = [
    {'name': 'System Administrator', 'value': 0},
    {'name': 'Administrator', 'value': 1},
    {'name': 'Analyst', 'value': 2},
    {'name': 'Operator', 'value': 3}
    ];

    $scope.$on('updatedUsersList', function(){
      UsersSvc.list().then(function(resp) {
        vm.users = resp;
      }); 
    });

    function getUsers() {
      var params;
      params = $route.current.params;

      if (!params.id) {
        UsersSvc.list().then(function(resp) {
          vm.users = resp;
          $rootScope.notifyInitialization();
        });
      } else if (params.id !== 'new') {
        UsersSvc.get(params.id).then(function(resp) {
          if(!resp.Active){
            gotoListPage();
          }
          vm.user = resp;
          original = angular.copy(vm.user);
          $rootScope.notifyInitialization();
        });
      } else if (params.id === 'new') {
        vm.user = {};
        original = angular.copy(vm.user);
        $rootScope.notifyInitialization();
      }
    }

    function canRevert() {
      return !angular.equals(vm.user, original) || !vm.userForm.$pristine;
    }

    function canSubmit() {
      return vm.userForm && vm.userForm.$valid && !angular.equals(vm.user, original);
    }

    function isCreate() {
      if (vm.user.EntityID) {
        return false;
      } else {
        return true;
      }
    }

    function save() {
      vm.saving = true;
      vm.userAlerts = [];

      UsersSvc.save(vm.user).then(function() {        
        vm.saving = false;
        $scope.$emit('getUser');
        gotoListPage();
      }, function(response){
        vm.saving = false;
        var error = response.data;
        if(error.errorCode && error.errorCode === 600){
          vm.saving = false;
          vm.userAlerts = [{'type':'danger', 'msg': 'User already exists with email. Please use a different email.'}];
        }
      });
    }

    function closeAlert(index) {
     vm.userAlerts.splice(index, 1);
   }

   function removeUser() {
    var dlg;
    dlg = dialogs.confirm('Remove "' + original.FirstName+' '+vm.user.LastName + '" User?', '');
    dlg.result.then(function() {
      UsersSvc.remove(vm.user.EntityID).then(function() {
        gotoListPage();
      });
    });
  }

  function selectRow(user){    
    if(vm.selectedEntity && vm.selectedEntity.EntityID === user.EntityID) {
      vm.selectedEntity = undefined;
    }else{
      vm.selectedEntity = user;
    }
  }

  function gotoListPage(){
   $location.path('/admin/users'); 
 }

 function editUser(user){
  $location.path('/admin/users/'+user.EntityID); 
 }
}

UsersCtrl.$inject = [
'$scope', '$location', '$route', 'UsersSvc', 'dialogs', '$rootScope'
];

angular.module('theme.core.main_controller').controller('UsersCtrl', UsersCtrl);
}).call(this);
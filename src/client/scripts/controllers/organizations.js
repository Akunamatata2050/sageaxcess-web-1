(function() {
  'use strict';

  function OrganizationsCtrl($scope, $location, $route, OrganizationsSvc, ApiKeySvc, KeyPairSvc, dialogs, $rootScope,notificationService, SessionService, $modal, deviceDetector) {
    var vm = this;
    
    //TODO: Need generic solution that works for all browsers.
    vm.isSafariBrowser=(deviceDetector.browser==='safari');
    vm.isEdgeBrowser=(deviceDetector.browser==='ms-edge');

    if(vm.isSafariBrowser || vm.isEdgeBrowser){
      vm.supportsClipboardApi=false;
    }
    else{
     vm.supportsClipboardApi=true;
   }


   if($rootScope.loggedInUser){
    loadOrganization();
  } else{
   SessionService.getUser().then(function(user) {
    $rootScope.loggedInUser = user;
    loadOrganization();
  });
 }

 loadApiKeys();
 loadKeyPairs();     

 vm.addApiKey=addApiKey;
 vm.removeApiKey=removeApiKey;
 vm.addKeyPair=addKeyPair;
 vm.removeKeyPair=removeKeyPair;
 vm.showApiKeyCommand=showApiKeyCommand;
 vm.showKeyPairCommand=showKeyPairCommand;
 vm.save=save;
 vm.populateTooltip=populateTooltip;
 vm.getTooltip=getTooltip;
 vm.resetTooltip=resetTooltip;
 vm.notification=notification;
 vm.exportSession=exportSession;


 vm.tooltips=[];

 function loadOrganization() {     
  OrganizationsSvc.get($rootScope.loggedInUser.ClientID).then(function(resp) {      
    vm.organization = resp;
    vm.resetTimeout=vm.organization.ResetLinkTimeoutInMinutes;
    $rootScope.notifyInitialization();
  });
}    

function addApiKey(apiKey){
  vm.saving=true;
  ApiKeySvc.save(apiKey).then(function(){      
    loadApiKeys();
  });
}

function loadApiKeys(){
  ApiKeySvc.list().then(function(resp){
    vm.apiKeys = resp;
    vm.saving=false;
    if(!vm.apiKeys){
      vm.apiKeys = [];
    }
    vm.apiKeys.push({'NewRow': true});
  });
}

function removeApiKey(apiKey){
  var dlg;
  dlg = dialogs.confirm('Remove "' + apiKey.Name + '" key?', '');
  dlg.result.then(function() {
    ApiKeySvc.remove(apiKey.EntityID).then(function(){
      loadApiKeys();
    });
  });
}

function addKeyPair(keyPair){
  vm.saving=true;
  KeyPairSvc.save(keyPair).then(function(){      
    loadKeyPairs();
  });
}
function loadKeyPairs(){
  KeyPairSvc.list().then(function(resp){
   vm.keyPairs = resp;
   vm.saving=false;
   if(!vm.keyPairs){
    vm.keyPairs = [];
  }
  vm.keyPairs.push({'NewRow': true});
});
}

function removeKeyPair(keyPair){
  var dlg;
  dlg = dialogs.confirm('Remove "' + keyPair.Name + '" key?', '');
  dlg.result.then(function() {
    KeyPairSvc.remove(keyPair.EntityID).then(function(){
      loadKeyPairs();
    });
  });
}
function showKeyPairCommand(keyPair){
  var modalInstance;
  modalInstance = $modal.open({
    templateUrl: 'views/organization/key_pair_run_command.html',
    controller: 'KeyPairRunCmdCtrl as modal',
    size: 'lg',
    resolve: {
      keyPair: function() {
        return keyPair;
      }
    }
  });
  return modalInstance.result.then(function() {     
    return function() {};
  });
}


function exportSession(){
 var modalInstance;
 modalInstance = $modal.open({
  templateUrl: 'views/organization/export_session.html',
  controller: 'ExportSessionCtrl as exportSessionCtrl',
  size: 'md'
});
 return modalInstance.result.then(function() {     
  return function() {};
});
}

function showApiKeyCommand(apiKey){
 var modalInstance;
 modalInstance = $modal.open({
  templateUrl: 'views/organization/api_key_run_command.html',
  controller: 'ApiKeyRunCmdCtrl as modal',
  size: 'md',
  resolve: {
    apiKey: function() {
      return apiKey;
    }
  }
});
 return modalInstance.result.then(function() {     
  return function() {};
});
}

function save(){
  OrganizationsSvc.save(vm.organization).then(function(){
    loadOrganization();
  });
}

function populateTooltip(index){    
  vm.tooltips[index] = 'Copied!';
}

function getTooltip(index){
  return vm.tooltips[index]?vm.tooltips[index]:'Copy to clipboard';
}

function resetTooltip(index){
  if(vm.tooltips[index] === 'Copied!'){
    vm.tooltips[index] = 'Copy to clipboard';
  }
}
function notification(timeout){
  if(timeout !== vm.resetTimeout){
    /*if(timeout >= 60){
      $rootScope.notifyInitialization();
      notificationService.success(' Email with reset link might be received with a delay ');
    }*/
    notificationService.success('Settings updated');
  }
}

}

OrganizationsCtrl.$inject = [
'$scope', '$location', '$route', 'OrganizationsSvc', 'ApiKeySvc', 'KeyPairSvc', 'dialogs', '$rootScope','notificationService', 'SessionService', '$modal', 'deviceDetector'
];

angular.module('theme.core.main_controller').controller('OrganizationsCtrl', OrganizationsCtrl);
}).call(this);
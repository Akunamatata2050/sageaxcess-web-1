(function() {
  'use strict';

  function KeyPairRunCmdCtrl($modalInstance, keyPair, deviceDetector) {
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

   vm.keyPair = angular.copy(keyPair);
   vm.ok = ok;
   vm.populateTooltip=populateTooltip;
   vm.getTooltip=getTooltip;
   vm.resetTooltip=resetTooltip;

   function ok() {
    $modalInstance.close();
  }    

  function populateTooltip(){    
    vm.tooltipStatus = 'Copied!';
  }

  function getTooltip(){
    return vm.tooltipStatus?vm.tooltipStatus:'Copy to clipboard';
  }

  function resetTooltip(){
    if(vm.tooltipStatus === 'Copied!'){
      vm.tooltipStatus = 'Copy to clipboard';
    }
  }
}
KeyPairRunCmdCtrl.$inject = ['$modalInstance', 'keyPair', 'deviceDetector'];
angular.module('theme.core.main_controller').controller('KeyPairRunCmdCtrl', KeyPairRunCmdCtrl);

}).call(this);
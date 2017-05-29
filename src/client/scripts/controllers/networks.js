(function() {
  'use strict';
  angular.module('theme.core.main_controller').controller('NetworksCtrl', NetworksCtrl);


  NetworksCtrl.$inject = [
  '$scope', '$location', '$route','$rootScope','NetworksSvc','SessionService','OfficesSvc', 'dialogs'
  ];

  function NetworksCtrl($scope, $location, $route, $rootScope,NetworksSvc,SessionService,OfficesSvc, dialogs) {

    var vm = this;
    vm.verifyNetwork=verifyNetwork;
    vm.getOffice=getOffice;
    vm.removeNetwork=removeNetwork;

    if($rootScope.loggedInUser){
      getNetworks($rootScope.loggedInUser.ClientID);
    } else{
     SessionService.getUser().then(function(user) {
      $rootScope.loggedInUser = user;
      getNetworks($rootScope.loggedInUser.ClientID);
    });
   }

   OfficesSvc.list(999,1,'Name').then(function(resp){
    vm.offices = resp.Result;
  });
   
   function getOffice(id) {

    var office=_.find(vm.offices, function(item){ return item.EntityID ===id; });
    return office?office.Name:'';
  }

  function getNetworks() { 
    NetworksSvc.list().then(function(resp) {
     vm.networks=resp;   
     if(!vm.networks){
      vm.networks=[];
    }
    vm.networks.push({'NewRow': true});
  });    
  }

  function verifyNetwork(network){
    network.Action = 'verify';
    NetworksSvc.save(network).then(function(resp){
      var dlg;
      if (resp.error){
        dlg = dialogs.error('Error', 
          'Hosts generated for this network are already a member of another network. Cant add network.');
        dlg.result.then(function() {

        }); 
      } else{
       dlg = dialogs.confirm('Confirm the network details?', 
        '<p>Network Address: '+resp.NetworkAddress+'</p>'+
        '<p>Block Size: '+resp.BlockSize+'</p>'+
        '<p>Subnet Mask: '+resp.SubnetMask+'</p>'+
        '<p>Broadcast Address: '+resp.BroadcastAddress+'</p>'+
        '<p>Total Number of Hosts: '+resp.NumberOfHosts+'</p>');
       dlg.result.then(function() {
        network.Action='approved';
        NetworksSvc.save(network).then(function(){
          getNetworks();
        });
      }); 
     }

   });
  }

  function removeNetwork(networkAddress){
    var dlg;
    dlg = dialogs.confirm('Confirm that you would like to remove the selected network?', 
      '');
    dlg.result.then(function() {
      NetworksSvc.remove(networkAddress).then(function(){
      getNetworks();
    });
   }); 
  }

}
}).call(this);
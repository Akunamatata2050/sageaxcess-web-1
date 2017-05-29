(function() {
  'use strict';
  angular.module('theme.core.messages_controller').controller('AggregatorCtrl', AggregatorCtrl);

  AggregatorCtrl.$inject = [
  '$scope', '$location', '$route', 'AggregatorSvc', '$rootScope', 'SessionService', 'dialogs'
  ];

  function AggregatorCtrl($scope, $location, $route, AggregatorSvc, $rootScope, SessionService, dialogs) {
    var vm = this;

    vm.deleteAggregator=deleteAggregator;

    if($rootScope.loggedInUser){
      getData();
    } else{
     SessionService.getUser().then(function(user) {
      $rootScope.loggedInUser = user;
      getData();
    });
   }


   function getData() {     
     AggregatorSvc.list($rootScope.loggedInUser.ClientID).then(function(resp) {
      vm.data = resp;      
      vm.filtereddata = angular.copy(vm.data);
      $rootScope.notifyInitialization();
    });
   }      

   function deleteAggregator(aggregator){
     var dlg;
    dlg = dialogs.confirm('Remove "' + aggregator.UniqueID + '" aggregator?', '');
    dlg.result.then(function() {
       AggregatorSvc.remove(aggregator.EntityID).then(function(){
        getData();
      });
    });   
   }
 }
}).call(this);
(function() {
  'use strict';

  function GroupsCtrl($scope, PeerGroupsSvc, ReportsSvc, PEER_GROUP_COLORS, $rootScope) {
    var vm = this;    

    vm.oneAtATime = true;      
    
    vm.saveGroupName = saveGroupName;

    var groupColor = d3.interpolateRgb(PEER_GROUP_COLORS.min, PEER_GROUP_COLORS.max); 

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
      vm.loadingData = true;
      PeerGroupsSvc.list().then(function(resp){
        vm.loadingData = false;
        if(resp){
          vm.groupsDetails = applyRandomValues(resp.slice(0)); 
          vm.statistics = getStat(vm.groupsDetails);
          console.log(vm.statistics);
        }        
      });
    }

    vm.getGroupColor = function(value, max) {
      return groupColor(max === 0 ? 0 : value / max);
    };

    function getStat(data) {
      var item, stat = {Total: [], HighRisk: [], Active: [], AnomaliesValue: 0, Groups: [], MaxHighRisk: 0};
      
      for (var i = 0; i < data.length; i++) {
        stat.Groups.push(angular.extend({}, {HighRisk: [], Active: [], AnomaliesValue: 0}, data[i]));

        for (var k = 0; k < data[i].Items.length; k++) {
          item = data[i].Items[k];

          if (item.HighRisk) {
            stat.Groups[i].HighRisk.push(item);
          }

          if (item.IsActive) {
            stat.Groups[i].Active.push(item);
          }

          stat.Groups[i].AnomaliesValue += item.Anomalies / data[i].Items.length;
        }

        stat.Total = stat.Total.concat(data[i].Items);
        stat.HighRisk = stat.HighRisk.concat(stat.Groups[i].HighRisk);
        stat.Active = stat.Active.concat(stat.Groups[i].Active);
        stat.AnomaliesValue += stat.Groups[i].AnomaliesValue / data.length;
        stat.MaxHighRisk = Math.max(stat.MaxHighRisk, stat.Groups[i].HighRisk.length);
      }

      return stat;
    }

    function applyRandomValues(data) {
      var newItem;

      for (var i = 0; i < data.length; i++) {
        data[i].Created = moment().subtract(Math.random() * 365, 'days').fromNow();

        for (var k = 0; k < data[i].Items.length; k++) {
          newItem = {};
          newItem.Id = data[i].Items[k];
          newItem.HighRisk = Math.random() < 0.2;
          newItem.IsActive = Math.random() < 0.8;
          newItem.Anomalies = Math.random() * 0.5;
          data[i].Items[k] = newItem;
        }
      }

      return data;
    }

    function saveGroupName(group, e){
      e.preventDefault();
      e.stopPropagation();
      group.edit = false;
      PeerGroupsSvc.save(group).then(function(){        
      });
    }
  }

  GroupsCtrl.$inject = [
  '$scope', 'PeerGroupsSvc', 'ReportsSvc', 'PEER_GROUP_COLORS', '$rootScope'
  ];

  angular.module('theme.core.main_controller').controller('GroupsCtrl', GroupsCtrl);
}).call(this);
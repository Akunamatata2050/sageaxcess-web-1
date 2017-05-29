(function() {
  'use strict';

  function UserRelationshipController($scope, $location, $routeParams, $timeout, RELATIONSHIP_COLORS, RELATIONSHIP_ICONS, UI) {
    $scope.data = {};
    $scope.loading = false;
    $scope.colors = RELATIONSHIP_COLORS;

    $scope.options = {
      zoomValue: 1,
      zoomStep: 0.5,
      showLinks: true,
      timePeriod: 'all',
      sortKey: 'Activity',
      icons: RELATIONSHIP_ICONS, 
      type:'Users',
      valueIndex: 0
    };

    getData(null, null, true);

    $scope.updateData = function(type, index, showLoadingBar){
      if (type) {
        $scope.options.type = type;
        $scope.options.valueIndex = index || 0;
      }
      
      getData($scope.options.type, $scope.options.valueIndex, showLoadingBar);
    };

    function getData(type, valueIndex, showLoadingBar) {
      $scope.loading = showLoadingBar;
      $timeout(function(){
        var data = {
          'Levels': [
            {
              'Type': 'Users',
              'Values': [
                {'Name':'Mike Kamanski'},
                {'Name':'Dan Counsell'},
                {'Name':'Adelle Charles'},
                {'Name':'Mr. Rogue'},
                {'Name':'Ritu Raj'}
              ]
            },
            {
              'Type': 'Accounts',
              'Values': [
                {'Name':'cdx\\nicole.muscat'}, 
                {'Name':'nmuscat'}, 
                {'Name':'nicolem'}
              ]
            },
            {
              'Type': 'Systems',
              'Values': [
                {'Name':'172.17.0.2'},
                {'Name':'wi-srvdc2.cdx.corp'},
                {'Name':'CDXWKSTACHARLES'},
                {'Name':'fedex-hp.cdx.corp'},
                {'Name':'CDXWKSTRITURAJ'},
                {'Name':'walpc036.cdx.corp'},
                {'Name':'tr-srvdc1.cdx.corp'},
                {'Name':'ty-srvdc29.cdx.corp'},
                {'Name':'ty-srvdc2.cdx.corp'},
                {'Name':'wilpc292'},
                {'Name':'bh-srvdc1.cdx.corp'}
              ]
            },
            {
              'Type': 'Resources',
              'Values': [
                {'Name':'am-exchcht1.cdx.corp'},
                {'Name':'CDXENGSRVR1'},
                {'Name':'CDXSRVFS01'},
                {'Name':'208.66.216.160'},
                {'Name':'208.80.48.160'},
                {'Name':'CDXWKSTMKAMANSKI'},
                {'Name':'CDXWKSTDCOUNSELL'},
                {'Name':'wilpc280'},
                {'Name':'10.176.1.156'},
                {'Name':'dell\\032s520\\0328b24.cdx.corp'}
              ]
            }
          ]
        };

        var centerLevelIndex = 0, centerLevel;
        for (var i = 0; i < data.Levels.length; i++) {
          if (data.Levels[i].Type === type) {
            centerLevelIndex = i;
          }
        }

        centerLevel = data.Levels.splice(centerLevelIndex, 1)[0];
        data.Center = {
          'Name': centerLevel.Values[valueIndex || 0].Name,
          'Type': centerLevel.Type,
          'IsActive': true
        };

        $scope.data = data;
        setRandomValues($scope.data);

        function setRandomValues(data) {
          angular.forEach(data.Levels, function(level, levelIndex){
            angular.forEach(level.Values, function(value){
              var newLinks = [], nextLevel, rand;

              if (levelIndex < data.Levels.length - 1) {
                nextLevel = data.Levels[levelIndex + 1];
                rand = Math.min(0.4, Math.random());
                 for(var i = 1; i < nextLevel.Values.length; i++) {
                   if (Math.random() < rand) {
                    newLinks.push({
                      'To':[levelIndex + 1, i],
                      'FirstTimeActivity':Math.random() < 0.07,
                      'Activities':Math.round(Math.random() * 100),
                      'Ports':getRandomPorts(),
                      'Protocols':paintArray(getRandomProtocols())
                    });
                   }
                }
              }
             
              if (levelIndex === 2) {
                value.Actions = getRandomActions();
              }

              value.Links = newLinks;
              value.Activity = Math.random();
              value.Activities = Math.round(Math.random() * 100);
              value.Protocols = paintArray(getRandomProtocols());
              value.Ports = getRandomPorts();
            });
          });

          function getRandomPorts() {
            var ports = [];

            for (var i = 0; i < Math.random(); i += 0.1) {
              ports.push(Math.round(Math.random() * 10000));
            }

            return ports;
          }

          function getRandomActions() {
            var i, actions = ['Checkout', 'Login', 'Logout', 'Database Access'];

            for (i = 0; i < actions.length && actions.length > 1; i++) {
              if (Math.random() > 0.5) {
                actions.pop();
              }
            }

            return actions;
          }

          function paintArray(arr) {
            var res = [];

            for (var i = 0; i < arr.length; i++) {
              res.push({'value':arr[i], 'color': UI.getColorByString(String(arr[i]), [0, 360], [10, 50], [70, 90])});
            }

            return res;
          }

          function getRandomProtocols() {
            var protocols = ['ARP', 'DHCP', 'DNS', 'DSN', 'FTP', 'HTTP', 'IMAP', 'ICMP', 'IDRP', 'IP', 'IRC', 'POP3', 'PAR', 'RLOGIN', 'SMTP', 'SSL', 'SSH', 'TCP', 'TELNET', 'UPD', 'UPS'],
                start = Math.random();
            return protocols.slice(start * protocols.length, Math.min(1, start + Math.random()) * protocols.length);
          }
        }

        $scope.loading = false;
      }, 1500);
      
    }

  }

  UserRelationshipController.$inject = [
  '$scope', '$location','$routeParams', '$timeout', 'RELATIONSHIP_COLORS', 'RELATIONSHIP_ICONS', 'UI'
  ];

  angular.module('theme.core.user_relationship_controller',[]).controller('UserRelationshipController', UserRelationshipController);
}).call(this);

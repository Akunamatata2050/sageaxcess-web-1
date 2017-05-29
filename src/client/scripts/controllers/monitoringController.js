(function() {
  'use strict';

  function MonitoringController($scope, $location) {
    $scope.data = {
        'name': 'Root',
        'children': [
            {
                'name': 'Office 1',
                'children': [
                    {
                        'name':'Aggregator 1',
                        'children':[
                            {'name': 'Monitor 1'},
                            {'name': 'Monitor 2'},
                            {'name': 'Collector 1'},
                            {'name': 'Collector 2'}
                        ]
                    },
                    {
                        'name':'Jeny',
                        'children':[
                            {'name': 'Monitor 3'},
                            {'name': 'Monitor 4'},
                            {'name': 'Collector 4'}
                        ]
                    }
                ]
            }, 
            {
                'name': 'Office 2',
                'children': [
                    {
                        'name':'Aggregator 2',
                        'children':[
                            {'name': 'Monitor 1'},
                            {'name': 'Monitor 2'},
                            {'name': 'Collector 1'},
                        ]
                    }
            ]
            }, 
            {
                'name': 'Office 3',
                'children': [
                    {
                        'name':'LAX',
                        'children':[
                            {'name': 'Monitor 1'},
                            {'name': 'Collector 1'}
                        ]
                    },
                    {
                        'name':'Gaya',
                        'children':[
                            {'name': 'Monitor 2'},
                            {'name': 'Collector 2'}
                        ]
                    }
                ]
            },
        ]
    };
  }

  MonitoringController.$inject = ['$scope', '$location'];
  angular.module('theme.core.monitoring_controller',[]).controller('MonitoringController', MonitoringController);
}).call(this);
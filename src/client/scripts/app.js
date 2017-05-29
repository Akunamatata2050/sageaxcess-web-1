'use strict';
angular
.module('app', [
  'theme',
  'config',
  'jm.i18next',
  'LocalStorageModule',
  'dialogs.default-translations',
  'dialogs.main',
  'ngclipboard',
  'ng.deviceDetector'
  ])
.value('diagramsSettings', {'activityDiagramType':'radial', 'intelligenceDiagramType':'grid'})
.constant({
  'ROUTES': [{
    'name': 'dashboard',
    'templateUrl': 'dashboard',
    'title':'Dashboard',
    'controller': 'DashboardController'
  },
  {
    'name': 'pages/forgot-password',
    'templateUrl': 'extras-forgotpassword',
    'publicPage': true
  }, {
    'name': 'pages/profile',
    'templateUrl': 'pages/profile'
  }, {
    'name': 'pages/signin',
    'templateUrl': 'extras-login',
    'publicPage': true
  }, {
    'name': 'pages/signup',
    'templateUrl': 'extras-registration',
    'publicPage': true
  }, {
    'name': 'admin/users',
    'templateUrl': 'users/list',
    'title':'Users'
  }, {
    'name': 'admin/users/:id',
    'templateUrl': 'users/form',
    'title':'Users'
  }, {
    'name': 'admin/clients',
    'templateUrl': 'clients/list'
  }, {
    'name': 'admin/clients/:id',
    'templateUrl': 'clients/form'
  }, {
    'name': 'admin/organization',
    'templateUrl': 'organization/tabs'
  },{
    'name': 'admin/keypairs',
    'templateUrl': 'organization/tabs'
  },{
    'name': 'admin/networks',
    'templateUrl': 'organization/tabs'
  },{
    'name': 'admin/offices',
    'templateUrl': 'organization/tabs'
  }, {
    'name': 'admin/offices/:id',
    'templateUrl': 'office/form'
  }, {
    'name': 'admin/departments',
    'templateUrl': 'organization/tabs'
  }, {
    'name': 'admin/departments/:id',
    'templateUrl': 'department/form'
  }, {
    'name': 'admin/settings',
    'templateUrl': 'organization/tabs'
  }, {
    'name': 'admin/export',
    'templateUrl': 'organization/tabs'
  }, {
   'name': 'unknown_file_paths',
   'templateUrl': 'unknown_file_paths/list',
   'title': 'Unknown File Paths'
 }, {
  'name': 'unknown_file_paths/:id',
  'templateUrl': 'unknown_file_paths/form',
  'title': 'Unknown File Paths'
  }, {
    'name': 'unknown_file_url',
    'templateUrl': 'unknown_file_url/list',
    'title': 'Unknown File URL\'s'
  }, {
    'name': 'unknown_file_url/:id',
    'templateUrl': 'unknown_file_url/form',
    'title': 'Unknown File URL\'s'
  }, {
    'name': 'path_expressions',
    'templateUrl': 'path_expressions/list',
    'title': 'Path Expressions'
  }, {
    'name': 'path_expressions/:id',
    'templateUrl': 'path_expressions/form',
    'title': 'Path Expressions'
  }, {
    'name': 'groups',
    'title': 'Groups',
    'templateUrl': 'groups/list',
    'controller':'GroupsCtrl as vm'
  }, {
    'name': 'url_expressions',
    'templateUrl': 'url_expressions/list',
    'title':'URL Expressions'
  }, {
    'name': 'url_expressions/:id',
    'templateUrl': 'url_expressions/form',
    'title':'URL Expressions'
  }, {
    'name': 'download',
    'templateUrl': 'download/download',
    'controller':'DownloadsController',
    'title':'Download'
  }, {
    'name': 'data',
    'templateUrl': 'data/list',
    'title':'Aggregators'
  }, {
    'name': 'users/relationship/:id',
    'templateUrl': 'users/relationship/list',
    'controller':'UserRelationshipController',
    'title':'Relationship'
  }, {
    'name': 'monitoring',
    'templateUrl': 'monitoring/list',
    'controller':'MonitoringController',
    'title':'Monitoring'
  }, {
    'name': 'systems/system/:index',
    'templateUrl': 'systems/system',
    'title':'System Details',
    'controller':'SystemDetailsController as systemDetailsController'
  }, {
    'name': 'systems/user/:index',
    'templateUrl': 'systems/user',
    'controller':'ActivityController',
    'resolves':[{
      'name': 'overviewData', 'value': ['ReportsSvc', function(ReportsSvc){
        return ReportsSvc.getActivityData();
      }]

    }]
  },
  {
    'name': 'users/details/:id',
    'templateUrl': 'users/user_details/details',
    'title':'User Details',
    'controller':'UserDetailsController as userDetailsController'
  }, {
      'name': 'systems',
      'templateUrl': 'systems/overview',
      'controller':'ActivityController',
      'resolves':[{
        'name': 'overviewData', 'value': ['ReportsSvc', function(ReportsSvc){
          return ReportsSvc.getActivityData();
      }]
    }]
  },{
    'name': 'activity',
    'templateUrl': 'activity/overview',
    'controller':'ActivityController',
    'title': 'Activity'
  },{
    'name': 'intelligence',
    'templateUrl': 'intelligence/intelligence',
    'controller':'IntelligenceController',
    'title':'Intelligence'
  },{
    'name': 'threats',
    'templateUrl': 'threats/list',
    'title': 'Threats'
  },{
    'name': 'securityInsider',
    'templateUrl': 'reoi/list'
  },{
    'name': 'identityManagement',
    'templateUrl': 'identity_management/list',
    'title':'Identity Management'
  },{
    'name': 'operationalInsight',
    'templateUrl': 'operational_insight/list',
    'title':'Operational Insight'
  },{
    'name': 'behavioralAnalysis',
    'templateUrl': 'behavioral_analysis/list',
    'title':'Behavioral Analysis'
  },{
    'name': 'deployment',
    'templateUrl': 'deployment/list',
    'title':'Deployment'
  },{
    'name': 'reoi',
    'templateUrl': 'reoi/list',
    'controller':'REOICtrl',
    'title':'Risk Events of Interest'
  },{
    'name': 'reoi/:id',
    'templateUrl': 'reoi/details',
    'controller':'REOIDetailsCtrl',
    'title':'Risk Events of Interest'
  },{
    'name': 'first-time-users',
    'templateUrl': 'first_time_users/list',
    'title':'First Time Users'
  },{
    'name': 'first-time-entities',
    'templateUrl': 'first_time_entities/list',
    'title':'First Time Entities'
  }
]
}).config([
'$routeProvider', 'ROUTES',
function($routeProvider, ROUTES) {
  var setRoutes;
  setRoutes = function(route) {
    var config, url;
    url = '/' + route.name;
    config = {
      title: route.title,
      templateUrl: 'views/' + route.templateUrl + '.html',
      resolve: {
        hasAccess: [
        'AccessSvc',
        function(AccessSvc) {
          if (route.publicPage) {
            return true;
          } else {
            return new AccessSvc();
          }
        }
        ]
      }
    };

    if (route.controller) {
      config.controller = route.controller;
    }

    if(route.resolves){
      route.resolves.forEach(function(item){
        config.resolve[item.name]  = item.value;
      });
    }

    $routeProvider.when(url, config);
    return $routeProvider;
  };
  ROUTES.forEach(function(route) {
    return setRoutes(route);
  });
  return $routeProvider.when('/404', {
    templateUrl: 'views/pages/404.html'
  }).when('/401', {
    templateUrl: 'views/extras-login.html'
  }).when('/', {
    templateUrl: 'views/dashboard.html'
  }).otherwise({
    redirectTo: '/dashboard'

  });
}
]).config([
'$i18nextProvider',
function($i18nextProvider) {
  $i18nextProvider.options = {

    /*lng: 'de', */
    useCookie: false,
    useLocalStorage: false,
    fallbackLng: 'dev',
    resGetPath: './locales/__lng__/__ns__.json',
    defaultLoadingValue: ''
  };
}
]).config([
'localStorageServiceProvider',
function(localStorageServiceProvider) {
  localStorageServiceProvider.setStorageCookie(30, '/');
  return localStorageServiceProvider.setStorageType('sessionStorage');
}
]).config([
'uiSelectConfig',
function(uiSelectConfig) {
  uiSelectConfig.theme = 'bootstrap';
}
]).config([
'$httpProvider',
function($httpProvider) {
  return $httpProvider.interceptors.push([
    '$q', '$location', '$rootScope',
    function($q, $location, $rootScope) {
      return {
        'request': function(config) {
           return config;
        },
        'response': function(response) {
          return response;
        },
        'responseError': function(rejection) {

          console.log('rejection:', rejection);
          if (rejection && rejection.status && rejection.status === 401) {
            $location.path('401');
          }
          return $q.reject(rejection);
        }
      };
    }
    ]);
}
])
.constant('PusherEvents', {})
.constant('PusherChannels', {
  SAGEAXCESS: 'sageaxcess',
})
.config(['$logProvider', 'ENV', function($logProvider, ENV) {
  $logProvider.debugEnabled(ENV.debugEnabled);
}])
.directive('demoOptions', function() {
  return {
    restrict: 'C',
    link: function(scope, element) {
      element.find('.demo-options-icon').css({
        display: 'none'
      });
    }
  };
})
.config(['notificationServiceProvider', function(notificationServiceProvider) {

  notificationServiceProvider.setDefaults({
    history: false,
    delay: 300,
    closer: true,
    /*jshint camelcase: false */
    closer_hover: true
    /*jshint camelcase: true */
  });

}])
.run([
  '$rootScope', 'ROUTES', 'SessionService',
  function($rootScope, ROUTES, SessionService) {
    var checkAuthorization, routes;
    routes = ROUTES;
    $rootScope.$on('$locationChangeStart', function(event, next) {
      var uriComponents = next.split('/');
      $rootScope.uiMetrics = {'StartTime': moment()};
      if(uriComponents.length>5){
        $rootScope.uiMetrics.Action = uriComponents[uriComponents.length-2]+'/'+uriComponents[uriComponents.length-1];
      } else{
        $rootScope.uiMetrics.Action = uriComponents[uriComponents.length-1];
      }

      var i, route, _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = ROUTES.length; _i < _len; i = ++_i) {
        route = ROUTES[i];
        _results.push(checkAuthorization(i, route, event, next));
      }
      return _results;
    });
    /*$rootScope.$on('$locationChangeSuccess', function(event, next) {
      $rootScope.uiMetrics.Duration = moment().diff($rootScope.uiMetrics.StartTime);
      $rootScope.uiMetrics.At = moment().utc().format();

    });*/
checkAuthorization = function(index, route, event, next) {
  if (next.indexOf(ROUTES[index].name) !== -1) {
    if (routes[index].publicPage) {

    } else {
      if (SessionService.isAuthorized() !== null) {

      } else {
        event.preventDefault();
      }
    }
  }
};
}
]).constant({
  PEER_GROUP_COLORS:{min:'#ebeef5', max:'#a9c1ec'},
  RELATIONSHIP_COLORS:['#429dca', '#656565', '#65bd59'],
  RELATIONSHIP_ICONS:{
    'Users': '/assets/img/custom-assets/diagram-user.svg',
    'Accounts': '/assets/img/custom-assets/diagram-account.svg',
    'Systems': '/assets/img/custom-assets/diagram-host.svg',
    'Resources': '/assets/img/custom-assets/diagram-resource.svg'
  }
});

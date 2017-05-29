angular.module('theme.core.main_controller', ['theme.core.services'])
.controller('MainController', ['$scope', '$theme', '$timeout', 'progressLoader', /*'wijetsService',*/ '$location', 'SessionService', '$route', '$modal','localStorageService', '$rootScope', 'UIMetricsSvc', 'ClientsSvc',
  function($scope, $theme, $timeout, progressLoader, /*wijetsService,*/ $location, SessionService, $route, $modal, localStorageService, $rootScope, UIMetricsSvc, ClientsSvc) {
    'use strict';
    var publicRoutes = ['/pages/forgot-password', '/pages/signin', '/pages/signup'];
    $scope.layoutFixedHeader = $theme.get('fixedHeader');
    $scope.layoutPageTransitionStyle = $theme.get('pageTransitionStyle');
    $scope.layoutDropdownTransitionStyle = $theme.get('dropdownTransitionStyle');
    $scope.layoutPageTransitionStyleList = ['bounce',
    'flash',
    'pulse',
    'bounceIn',
    'bounceInDown',
    'bounceInLeft',
    'bounceInRight',
    'bounceInUp',
    'fadeIn',
    'fadeInDown',
    'fadeInDownBig',
    'fadeInLeft',
    'fadeInLeftBig',
    'fadeInRight',
    'fadeInRightBig',
    'fadeInUp',
    'fadeInUpBig',
    'flipInX',
    'flipInY',
    'lightSpeedIn',
    'rotateIn',
    'rotateInDownLeft',
    'rotateInDownRight',
    'rotateInUpLeft',
    'rotateInUpRight',
    'rollIn',
    'zoomIn',
    'zoomInDown',
    'zoomInLeft',
    'zoomInRight',
    'zoomInUp'
    ];

    $scope.layoutLoading = true;
    $scope.currentYear = new Date().getFullYear();
    $scope.previousYear = new Date().getFullYear()-1;
    
    $scope.getLayoutOption = function(key) {
      return $theme.get(key);
    };

    $scope.setNavbarClass = function(classname, $event) {
      $event.preventDefault();
      $event.stopPropagation();
      $theme.set('topNavThemeClass', classname);
    };

    $scope.setSidebarClass = function(classname, $event) {
      $event.preventDefault();
      $event.stopPropagation();
      $theme.set('sidebarThemeClass', classname);
    };

    $scope.$watch('layoutFixedHeader', function(newVal, oldval) {
      if (newVal === undefined || newVal === oldval) {
        return;
      }
      
      $theme.set('fixedHeader', newVal);
    });
    $scope.$watch('layoutLayoutBoxed', function(newVal, oldval) {
      if (newVal === undefined || newVal === oldval) {
        return;
      }
      $theme.set('layoutBoxed', newVal);
    });
    $scope.$watch('layoutLayoutHorizontal', function(newVal, oldval) {
      if (newVal === undefined || newVal === oldval) {
        return;
      }
      $theme.set('layoutHorizontal', newVal);
    });
    $scope.$watch('layoutPageTransitionStyle', function(newVal) {
      $theme.set('pageTransitionStyle', newVal);
    });
    $scope.$watch('layoutDropdownTransitionStyle', function(newVal) {
      $theme.set('dropdownTransitionStyle', newVal);
    });
    $scope.$watch('layoutLeftbarCollapsed', function(newVal, oldVal) {
      if (newVal === undefined || newVal === oldVal) {
        return;
      }
      $theme.set('leftbarCollapsed', newVal);
    });

    $scope.$watch('loggedInUser', function(newVal, oldval) {
      if (newVal !== oldval) {
        var nameNode = $('#sidebar-info-username');
        var parentNode = nameNode.parent();
        var parentRatio =  parentNode.width() / nameNode.width();
        var fontSize = 14;
        nameNode.css({'font-size':fontSize * Math.min(1, parentRatio) + 'px'});
      }
    });

    $scope.toggleLeftBar = function() {
      $theme.set('leftbarCollapsed', !$theme.get('leftbarCollapsed'));      
      $rootScope.$broadcast('leftbarCollapsed', $theme.get('leftbarCollapsed'));        
    };

    $scope.$on('themeEvent:maxWidth767', function(event, newVal) {
      $timeout(function() {
        $theme.set('leftbarCollapsed', newVal);
      });
    });
    $scope.$on('themeEvent:changed:fixedHeader', function(event, newVal) {
      $scope.layoutFixedHeader = newVal;
    });
    $scope.$on('themeEvent:changed:layoutHorizontal', function(event, newVal) {
      $scope.layoutLayoutHorizontal = newVal;
    });
    $scope.$on('themeEvent:changed:layoutBoxed', function(event, newVal) {
      $scope.layoutLayoutBoxed = newVal;
    });
    $scope.$on('themeEvent:changed:leftbarCollapsed', function(event, newVal) {
      $scope.layoutLeftbarCollapsed = newVal;
    });

    $scope.toggleSearchBar = function($event) {
      $event.stopPropagation();
      $event.preventDefault();
      $theme.set('showSmallSearchBar', !$theme.get('showSmallSearchBar'));
    };

    var logoutHandler = function() {
      $rootScope.$broadcast('userLoggedOut');
      $location.search('clientId', undefined);
      $location.path('/pages/signin');
      /*$route.reload();*/
    };
    var errorHandler = function(err) {
      $scope.message = 'Error! ' + err.data.error;
    };

    $scope.logout = function() {
      SessionService.logout({}, logoutHandler, errorHandler);
    };

    $scope.getUser = function() {

      if($rootScope.loadingUser){
        return;
      } else{
       $rootScope.loadingUser = true;
       SessionService.getUser(true).then(function(user) {
        $rootScope.loggedInUser = user;
        $rootScope.loadingUser = false;   
        $rootScope.isLoggedIn = true;           

        if($rootScope.loggedInUser.IsAegisAdministrator){
          ClientsSvc.list(true).then(function(resp){
            $rootScope.clients = resp;
            if(!isClientSelected()){
              if(resp.length > 0){
                var clientId = resp[0].EntityID;
                $rootScope.loggedInUser.LastViewedClientID=clientId;         
              }              
            }            
            
            $scope.$broadcast('userLoaded');            
          });
        } else{
           ClientsSvc.get($rootScope.loggedInUser.ClientID).then(function(resp){
            $scope.$broadcast('userLoaded');  
            $rootScope.clientName = resp.Name;
           });          
        }

        if(!user.IsAcceptedLicense){          
          $scope.showUserAcceptance();
        }else if(user.ChangePasswordOnLogin){        
          $scope.changePassword();
        }

      });
     }     
   };

   function isClientSelected(){
    var clientId = $rootScope.loggedInUser.LastViewedClientID;
    return clientId && clientId.length>0;
  }

  if (SessionService.isAuthorized()) {
    $rootScope.isLoggedIn = true;
    $scope.getUser();
  } else {
    $rootScope.isLoggedIn = false;

    if (!isPublicPage($location.path())) {
      localStorageService.set('requested_path', $location.path());
      $location.path('/pages/signin');
    }
  }  

  /*$scope.$watch('loggedInUser.LastViewedClientID', function(nv,ov){    
    debugger;
    if(ov && nv && nv!==ov){      
            
    }
  });*/

  $scope.updateLastViewedClientdID = function(){
    SessionService.updateProfile($rootScope.loggedInUser).then(function(user){
        $rootScope.loggedInUser=user;
        /*$scope.$broadcast('clientChanged');*/
        $route.reload();
      });
  }

  function isPublicPage(url){
    return publicRoutes.indexOf(url) !== -1;
  }

  $scope.$on('$routeChangeStart', function(e) {
    if ($location.path() === '') {
      return $location.path('/');
    }

    if(!SessionService.isAuthorized() && !isPublicPage($location.path())){
     $location.path('/pages/signin');
   }

   if(SessionService.isAuthorized() && isPublicPage($location.path())){
    $location.path('/dashboard');
  }

    //Restrict url access based on user permissions.
    //Need to revisit for more fine grained access
    if($location.path().indexOf('admin') !== -1 && ($rootScope.loggedInUser && $rootScope.loggedInUser.PermissionLevel >1)){      
      e.preventDefault();
    } else{
      progressLoader.start();
      progressLoader.set(50);
    }    
  });
  $scope.$on('$routeChangeSuccess', function() {
    progressLoader.end();
    if ($scope.layoutLoading) {
      $scope.layoutLoading = false;
    }
    /*wijetsService.make();*/

    if ($route.current) {
      $rootScope.title = $route.current.$$route.title;
    }
    else {
      $rootScope.title = '';
    }
  });

  $scope.$on('getUser', function() {
    $scope.getUser();
  });

  $scope.profile = function() {

    var modalInstance;
    modalInstance = $modal.open({
      templateUrl: 'views/extras-profile.html',
      controller: 'ProfileCtrl as modal',
      size: 'md',
      resolve: {
        profile: function() {
          return SessionService.getUser();
        }
      }
    });
    return modalInstance.result.then(function() {

    });
  };

  $scope.showUserAcceptance = function() {
    var modalInstance;
    modalInstance = $modal.open({
      templateUrl: 'views/user-acceptance.html',
      controller: 'UserAcceptanceCtrl as modal',
      size: 'md',
      backdrop: 'static',
      resolve: {
        profile: function() {
          return $rootScope.loggedInUser;
        }
      }
    });
    modalInstance.result.then(function(resp) {      
      $scope.getUser();
    });
  };  

  $scope.changePassword = function() {
    var modalInstance;
    modalInstance = $modal.open({
      templateUrl: 'views/change-password.html',
      controller: 'ChangePasswordCtrl as modal',
      size: 'md',
      resolve: {
        profile: function() {
          return $rootScope.loggedInUser;
        }
      }
    });
    return modalInstance.result.then(function() {});
  };  

  $rootScope.notifyInitialization = function(){
    $rootScope.uiMetrics.Duration = moment().diff($rootScope.uiMetrics.StartTime);      
    $rootScope.uiMetrics.At = moment().utc().format();
    $rootScope.uiMetrics.TimeZone = new Date().toString();
    UIMetricsSvc.save($rootScope.uiMetrics);

  };
}
]);
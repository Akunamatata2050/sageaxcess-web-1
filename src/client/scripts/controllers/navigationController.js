angular

.module('theme.core.navigation_controller', ['theme.core.services'])
.controller('NavigationController', ['$scope', '$location','$route', '$timeout', '$rootScope', function($scope, $location,$route, $timeout, $rootScope) {
  'use strict';

  function intializeMenu(){
    var manageUserItem={
      label: 'Users',
      url: '#/admin/users',
      otherUrls:[
      '#/users/details'
      ]
    };

    var manageEntityItem={
      label: 'Entity and Locations',
      url: '#/admin/organization',
      otherUrls:[
      '#/admin/offices',
      '#/admin/departments',
      '#/admin/settings'
      ]
    };

    $scope.menu = 
    [{
      label: 'Dashboard',
      iconClasses: 'nav-icon dashboard-icon',
      url: '#/dashboard'
    },
    {
      label: 'Activity',
      iconClasses: 'nav-icon activity-icon',
      url: '#/activity'
    },
    {
      label: 'Intelligence',
      iconClasses: 'nav-icon intelligence-icon',
      children:[{
        label: 'Risk Events',
        url: '#/reoi'
      },
      {
        label: 'Dynamic Groups',
        url: '#/groups'
      },
      {
        label: 'Entity Grid',
        url: '#/intelligence'
      }]
    },
    {
      label: 'Manage',
      iconClasses: 'nav-icon manage-icon',
      children:[{
        label: 'Deployment',
        url: '#/data'
      },
      {
        label: 'Downloads',
        url: '#/download'
      },manageUserItem,manageEntityItem,
      {
       label: 'Categorizations',
       children:[{
          label: 'Uncategorized File Paths',
          url: '#/unknown_file_paths'
        },
        {
          label: 'Uncategorized URL/Application Paths',
          url: '#/unknown_file_url'
        },
        {
          label: 'Path Expressions',
          url: '#/path_expressions'
        },
        {
          label: 'URL Expressions',
          url: '#/url_expressions'
        }]
      }]
    }];
  }

  function isUserAnalyst(user){
    return user.PermissionLevel === 2
  }

  function isUserOperator(user){
    return user.PermissionLevel === 3
  }
  
  $scope.getItemUrl = function(item){

    return item.url? ($location.search()['clientId']?item.url+'?clientId='+$location.search()['clientId']:item.url): '';
  };

  $scope.$on('userLoaded', function(){
    if(isUserAnalyst($rootScope.loggedInUser) || isUserOperator($rootScope.loggedInUser)){
      //Remove Users /Entity and Locations for non admin users
      // menu index value is hardcoded because, _findIndex is not working in underscore ~1.5.2
      $scope.menu[3].children.splice(2,1);
      $scope.menu[3].children.splice(2,1);
    }
  });

  var setParent = function(children, parent) {
    angular.forEach(children, function(child) {
      child.parent = parent;
      if (child.children !== undefined) {
        setParent(child.children, child);
      }
    });
  };

  $scope.findItemByUrl = function(children, url) {
    for (var i = 0, length = children.length; i < length; i++) {
      if (children[i].url && children[i].url.replace('#', '') === url) {
        return children[i];
      }else{
        if(children[i].otherUrls){
          var urlPath =  children[i].otherUrls;
          for (var j = 0, length2 = urlPath.length; j< length2; j++){
            if(urlPath[j].replace('#', '') === url){
              return children[i];
            }
          }
        }
      }
      if (children[i].children !== undefined) {
        var item = $scope.findItemByUrl(children[i].children, url);
        if (item) {
          return item;
        }
      }
    }
  }; 

  $scope.openItems = []; $scope.selectedItems = []; $scope.selectedFromNavMenu = false;
  $scope.select = function(item) {
      // close open nodes
      if (item.open) {
        item.open = false;
        return;
      }
      for (var i = $scope.openItems.length - 1; i >= 0; i--) {
        $scope.openItems[i].open = false;
      }
      $scope.openItems = [];
      var parentRef = item;
      while (parentRef) {
        parentRef.open = true;
        $scope.openItems.push(parentRef);
        parentRef = parentRef.parent;
      }

      // handle leaf nodes
      if (!item.children || (item.children && item.children.length < 1)) {
        // $scope.selectedFromNavMenu = true;
        for (var j = $scope.selectedItems.length - 1; j >= 0; j--) {
          $scope.selectedItems[j].selected = false;
        }
        $scope.selectedItems = [];
        parentRef = item;
        while (parentRef) {
          parentRef.selected = true;
          $scope.selectedItems.push(parentRef);
          parentRef = parentRef.parent;
        }
      }
    };

    $scope.highlightedItems = [];
    var highlight = function(item) {
      var parentRef = item;
      while (parentRef !== null) {
        if (parentRef.selected) {
          parentRef = null;
          continue;
        }
        parentRef.selected = true;
        $scope.highlightedItems.push(parentRef);
        parentRef = parentRef.parent;
      }
    };

    var highlightItems = function(children, query) {
      angular.forEach(children, function(child) {
        if (child.label.toLowerCase().indexOf(query) > -1) {
          highlight(child);
        }
        if (child.children !== undefined) {
          highlightItems(child.children, query);
        }
      });
    };

    // $scope.searchQuery = '';
    $scope.$watch('searchQuery', function(newVal, oldVal) {
      var currentPath = '#' + $location.path();
      if (newVal === '') {
        for (var i = $scope.highlightedItems.length - 1; i >= 0; i--) {
          if ($scope.selectedItems.indexOf($scope.highlightedItems[i]) < 0) {
            if ($scope.highlightedItems[i] && $scope.highlightedItems[i] !== currentPath) {
              $scope.highlightedItems[i].selected = false;
            }
          }
        }
        $scope.highlightedItems = [];
      } else
      if (newVal !== oldVal) {
        for (var j = $scope.highlightedItems.length - 1; j >= 0; j--) {
          if ($scope.selectedItems.indexOf($scope.highlightedItems[j]) < 0) {
            $scope.highlightedItems[j].selected = false;
          }
        }
        $scope.highlightedItems = [];
        highlightItems($scope.menu, newVal.toLowerCase());
      }
    });

    //Removes id parameter to select matching menu item
    function processUrl()
    {
      var url = $location.path();
      var params = $route.current.params;

      if(params.id){
        var urlPart = url.split('/');
        urlPart.pop(urlPart.length-1);
        url = urlPart.join('/');
      }
      return url;
    }

    $rootScope.$on('userLoggedOut', function(){
      $scope.menu = undefined;
    });

    $scope.$on('$routeChangeSuccess', function() {      
      if(!$scope.menu){
        intializeMenu();
        setParent($scope.menu, null);
      }

      var url = processUrl();
      if ($scope.selectedFromNavMenu === false) {
        var item = $scope.findItemByUrl($scope.menu, url);
        if (item) {
          $timeout(function() {
            $scope.select(item);
          });
        }
      }
      $scope.selectedFromNavMenu = false;
      $scope.searchQuery = '';
    });
  }]);

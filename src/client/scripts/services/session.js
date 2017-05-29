(function() {
  'use strict';

  function SessionService($resource, $q, $cookieStore, ENV, localStorageService, $rootScope) {

    var data = {};

    function service() {
      return $resource(ENV.apiEndpoint + '/guest/:param', {}, {
        'login': {
          'method': 'POST'
        },
        'logout': {
          'method': 'DELETE'
        },
        'signup': {
          'method': 'POST'
        }
      });
    }

    function profileService() {
      var token;
      token = getToken() || null;
      return $resource(ENV.apiEndpoint + '/user-account/profile', {}, {
        'get': {
          'method': 'GET',
          'headers': {
            'Authorization': token.value
          }
        },
        'update': {
          'method': 'PUT',
          'headers': {
            'Authorization': token.value
          }
        }
      });
    }

    function setUser(user) {      
      data.user = user;
      setId(data.user.UserAccountID);
      data.userId = data.user.UserAccountID;
    }

    function setToken(token, rememberMe) {
      if (rememberMe) {
        localStorageService.cookie.set('token', token);
      } else {
        localStorageService.set('token', token);
      }
    }

    function setId(id) {
      if (localStorageService.cookie.get('token')) {
        return localStorageService.cookie.set('id', id);
      } else {
        return localStorageService.set('id', id);
      }
    }

    function getToken() {
      var token;

      if (localStorageService.get('token')) {
        token = localStorageService.get('token');
      } else {
        token = localStorageService.cookie.get('token');
      }

      return {
        'value': 'Basic ' + token
      };
    }

    function populatePermissions(user){
      if(user.PermissionLevel === 0){
        user.IsSysAdmin = true;
      }

      if(user.PermissionLevel === 1){
        user.IsAdmin = true;
      }

      if(user.PermissionLevel === 2){
        user.IsAnalyst = true;
      }

      if(user.PermissionLevel === 3){
        user.IsOperator = true;
      }
    }

    function login(newUser, resultHandler, errorHandler) {
      var rememberMe, user;
      rememberMe = newUser.rememberMe;
      user = angular.copy(newUser);
      delete user.rememberMe;
      return service().login({
        'param': 'login'
      }, user, function(res) {
        if (res.AuthToken) {
          setToken(res.AuthToken, rememberMe);
        }
        $rootScope.loggedInUser = res;
        return resultHandler(res);
      }, function(err) {
        return errorHandler(err);
      });
    }

    function logout(userId, resultHandler) {
      localStorageService.clearAll();
      localStorageService.cookie.clearAll();
      data.userId = void 0;
      data.user = void 0;
      resultHandler();
    }

    function isAuthorized() {
      var value = getToken().value.split('Basic ');

      return value[1] && value[1] !== 'null' && value[1].length > 0;
    }

    function getUser(forceGet) {   
        
      var deferred;
      deferred = $q.defer();
      if (!forceGet && data.user) {
        deferred.resolve(data.user);
      } else if (isAuthorized()) {
        profileService().get({}, function(user) {
        
          populatePermissions(user);
          setUser(user);
          return deferred.resolve(data.user);
        }, function(err) {
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    function updateProfile(profile) {
      var deferred;
      deferred = $q.defer();
      profileService().update({}, profile, function(resp) {
        if (resp.AuthToken){
          setToken(resp.AuthToken, false);
        }
        setUser(resp);
        deferred.resolve(resp);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }    

    function signup(newUser, resultHandler, errorHandler) {
      var user;
      user = angular.copy(newUser);

      return service().signup({
        'param': 'signup'
      }, user, function() {
        return resultHandler();
      }, function(err) {
        return errorHandler(err);
      });
    }

    return {
      login: login,
      logout: logout,
      getUser: getUser,
      updateProfile: updateProfile,
      isAuthorized: isAuthorized,
      getToken: getToken,
      signup: signup
    };
  }

  SessionService.$inject = [
    '$resource', '$q', '$cookieStore', 'ENV', 'localStorageService', '$rootScope'
  ];

  angular
    .module('app')
    .factory('SessionService', SessionService);
})();
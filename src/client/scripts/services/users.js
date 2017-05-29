(function() {
  'use strict';

  function UsersSvc($resource, $cookies, $q, ENV, SessionService, localStorageService, $rootScope) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/user-account/:id/?', {}, {
        'list': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          },
          'isArray': true
        },
        'get': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },
        'update': {
          'method': 'PUT',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },
        'add': {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        },
        'delete': {
          'method': 'DELETE',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function changePasswordService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/user-account/changepassword', {}, {
        'change': {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function cancelPasswordChangeService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/user-account/cancelpasswordchange', {}, {
        'change': {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function resetPasswordService() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/guest/resetpassword', {}, {
        'reset': {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': token.value
          }
        }
      });
    }

    function setToken(token) {
      if (localStorageService.get('token')) {
        return localStorageService.set('token', token);
      } else {
        return localStorageService.cookie.set('token', token);
      }
    }

    function list() {
      var deferred;
      deferred = $q.defer();
      service().list({}, function(users) {
        return deferred.resolve(users);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function get(id) {
      var deferred;
      deferred = $q.defer();
      service().get({
        'id': id
      }, function(users) {
        return deferred.resolve(users);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function save(user) {
      var deferred;
      deferred = $q.defer();

      if (user.EntityID) {

        service().update({'id':user.EntityID,}, user, function() {
          return SessionService.getUser(true).then(function(user) {
            return deferred.resolve(user);
          });
        }, function(err) {
          return deferred.reject(err);
        });
      } else {
        service().add({}, user, function(resp) {
          return deferred.resolve(resp);
        }, function(err) {
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    function remove(id) {
      var deferred;
      deferred = $q.defer();
      service()['delete']({
        'id': id,
      }, function(users) {
        return deferred.resolve(users);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function changePassword(data) {
      var deferred;
      deferred = $q.defer();
      changePasswordService().change({}, {
        'UserAccountID': data.UserAccountID,
        'NewPassword': data.NewPassword,
        'CurrentPassword': data.CurrentPassword
      }, function(resp) {
        setToken(resp.AuthToken);
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function cancelPasswordChange(data) {
      var deferred;
      deferred = $q.defer();
      cancelPasswordChangeService().change({}, {
        'UserAccountID': data.UserAccountID
      }, function(resp) {
        SessionService.getUser(true).then(function() {});
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }

    function resetPassword(data) {
      var deferred;
      deferred = $q.defer();
      resetPasswordService().reset({}, data, function(resp) {
        return deferred.resolve(resp);
      }, function(err) {
        return deferred.reject(err);
      });
      return deferred.promise;
    }


    return {
      list: list,
      get: get,
      save: save,
      remove: remove,
      changePassword: changePassword,
      resetPassword : resetPassword,
      cancelPasswordChange: cancelPasswordChange
    };
  }

  UsersSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService', 'localStorageService', '$rootScope'
  ];

  angular
  .module('app')
  .factory('UsersSvc', UsersSvc);
})();

(function() {
  'use strict';

  angular.module('app').factory('UnknownFilePathSvc', UnknownFilePathSvc);

  UnknownFilePathSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function UnknownFilePathSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/expressions/unknownfilepath/:id/?ps=:ps&cp=:cp&sort=:sort&search=:search', {}, {
        'list': {
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
        'get': {
          'method': 'GET',
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

function list(ps, cp, sort, search) {      
  var deferred;
  deferred = $q.defer();
  
  if(!sort){
    sort ='Timestamp';
  }      
  
  service().list({'ps': ps?ps:10, 'cp': cp?cp:1, 'sort': sort, 'search': search?encodeURIComponent(search):''}, function(resp) {
    if(resp.Result){
      resp.Result.forEach(function(item){
        item.TimestampDisplay = moment.unix(item.Timestamp).fromNow();
      });
    }
    
    return deferred.resolve(resp);        
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
  }, function(resp) {
    return deferred.resolve(resp);
  }, function(err) {
    return deferred.reject(err);
  });
  return deferred.promise;
}

function save(unknownFilePath) {
  var deferred;
  deferred = $q.defer();
  if (unknownFilePath.EntityID) {
    service().update({'id': unknownFilePath.EntityID}, unknownFilePath, function(resp) {
      return deferred.resolve(resp);
    }, function(err) {
      return deferred.reject(err);
    });
  } else {
    service().add({}, unknownFilePath, function(resp) {
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
    'id': id
  }, function(unknownFilePaths) {
    return deferred.resolve(unknownFilePaths);
  }, function(err) {
    return deferred.reject(err);
  });
  return deferred.promise;
}


return {
  list: list,
  get: get,
  save: save,
  remove: remove
};  
}

})();

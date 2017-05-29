(function() {
  'use strict';

  angular.module('app').factory('UnknownFileUrlSvc', UnknownFileUrlSvc);

  UnknownFileUrlSvc.$inject = [
  '$resource', '$cookies', '$q', 'ENV', 'SessionService'
  ];

  function UnknownFileUrlSvc($resource, $cookies, $q, ENV, SessionService) {

    function service() {
      var token;
      token = SessionService.getToken() || null;
      return $resource(ENV.apiEndpoint + '/expressions/unknownurl/:id/?ps=:ps&cp=:cp&sort=:sort&search=:search', {}, {
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

function save(unknownFileUrl) {
  var deferred;
  deferred = $q.defer();
  if (unknownFileUrl.EntityID) {
    service().update({'id': unknownFileUrl.EntityID}, unknownFileUrl, function(resp) {
      return deferred.resolve(resp);
    }, function(err) {
      return deferred.reject(err);
    });
  } else {
    service().add({}, unknownFileUrl, function(resp) {
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
  }, function(unknownFileUrl) {
    return deferred.resolve(unknownFileUrl);
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
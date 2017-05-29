angular
  .module('theme.core.downloads_controller', [])
  .controller('DownloadsController', ['$scope', function($scope) {
    'use strict';

    if (navigator.platform.toUpperCase().indexOf('MAC') !==- 1) {
    	$scope.os = 'mac';
    }
    else if (navigator.platform.toUpperCase().indexOf('LINUX') !== -1) {
    	$scope.os = 'linux';
    }
    else {
    	$scope.os = 'windows';
    }
  }]);
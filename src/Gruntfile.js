'use strict';

var LIVERELOAD_PORT, lrSnippet;

LIVERELOAD_PORT = 35728;

lrSnippet = require('connect-livereload')({
  port: LIVERELOAD_PORT
});

var mountFolder = function(connect, dir) {
  return connect['static'](require('path').resolve(dir));
};

module.exports = function(grunt) {
  var path = require('path') ;
  var yeomanConfig = {
    app: 'client',
    dist: 'dist',
    docs: 'documentation',
    lrp: 35728,
    lrSnippet: lrSnippet,
    mountFolder: mountFolder
    } ;

     try {
      yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
    } catch (_error) {}

    require('time-grunt')(grunt);   
  require('load-grunt-config') (grunt, {
    // path to task.js files, defaults to grunt dir
    configPath: path.join(process.cwd(), 'grunt'),

    // auto grunt.initConfig
        init: true,

    // data passed into config. Can use with < % = test % >
    data: {
      yeoman: yeomanConfig
    } ,

    // can optionally pass options to load - grunt - tasks.
    // If you set to false, it will disable auto loading tasks.
    loadGruntTasks: {

      pattern: 'grunt-*'
      /*config: require('./package.json'),
      scope: 'devDependencies'*/
    }

  } ) ;
  } ;


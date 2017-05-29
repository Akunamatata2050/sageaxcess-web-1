module.exports = {
  bower: {
    files: ['bower.json'],
    tasks: ['bowerInstall']
  },
  js: {
    files: ['<%= yeoman.app %>/scripts/**/*.js'],
    tasks: ['newer:jshint:all'],
    options: {
      livereload: true
    }
  },
  jsTest: {
    files: ['test/spec/{,*/}*.js'],
    tasks: ['newer:jshint:test', 'karma']
  },
  styles: {
    files: ['<%= yeoman.app %>/styles/{,*/}*.css'],
    tasks: ['newer:copy:styles', 'autoprefixer']
  },
  less: {
    files: ['<%= yeoman.app %>/assets/less/{,html/}*.less'],
    tasks: ['less:server']
  },
  gruntfile: {
    files: ['Gruntfile.js']
  },
  livereload: {
    options: {
      livereload: "<%= yeoman.lrp %>"
    },
    files: [
      '<%= yeoman.app %>/**/*.html',
      '<%= yeoman.app %>/scripts/**/*.js',
      '.tmp/assets/**/*.css',
      '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
    ]
  }
};
module.exports = {	
	server: {
		options: {
          // strictMath: true,
          dumpLineNumbers: true,
          sourceMap: true,
          sourceMapRootpath: '',
          outputSourceFiles: true
      },
      files: [
      {
      	expand: true,
      	cwd: '<%= yeoman.app %>/assets/less',
      	src: 'styles.less',
      	dest: '.tmp/assets/css',
      	ext: '.css'
      }
      ]
  },
  dist: {
  	options: {
  		cleancss: true,
  		report: 'min'
  	},
  	files: [
  	{
  		expand: true,
  		cwd: '<%= yeoman.app %>/assets/less',
  		src: 'styles.less',
  		dest: '.tmp/assets/css',
  		ext: '.css'
  	}
  	]
  }
};
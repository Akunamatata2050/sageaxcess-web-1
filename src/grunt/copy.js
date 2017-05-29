module.exports = {
	
	dist: {
		files: [{
			expand: true,
			dot: true,
			cwd: '<%= yeoman.app %>',
			dest: '<%= yeoman.dist %>',
			src: [
			'*.{ico,png,txt}',
			'.htaccess',
			'*.html',
            'views/**/*.html',
            'images/**.*.{webp}',
            'assets/**',
            'locales/**/*.*',
            // these files are lazyloaded
            'bower_components/jquery.inputmask/dist/jquery.inputmask.bundle.js',
            'bower_components/jquery-validation/dist/jquery.validate.js',
            'bower_components/jqvmap/jqvmap/maps/jquery.vmap.europe.js',
            'bower_components/jqvmap/jqvmap/maps/jquery.vmap.usa.js',
            'bower_components/stepy/lib/jquery.stepy.js',
            'bower_components/Chart.js/Chart.min.js',
            'bower_components/raphael/raphael.js',
            'bower_components/morris.js/morris.js',
            'bower_components/fullcalendar/dist/fullcalendar.js',
            'assets/plugins/jvectormap/jquery-jvectormap-world-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-cn-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-dk-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-europe-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-in-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-nl-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-se-mill-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-us-aea-en.js',
            'assets/plugins/jvectormap/jquery-jvectormap-us-ny-newyork-mill-en.js',
            ]
        }, {
        	expand: true,
        	flatten: false,
        	cwd: '<%= yeoman.app %>/assets/plugins/iCheck/skins',
        	dest: '<%= yeoman.dist %>/assets/css/',
        	src: ['*/*.png']
        }, {
        	expand: true,
        	flatten: true,
        	cwd: '<%= yeoman.app %>',
        	dest: '<%= yeoman.dist %>/assets/css/fonts',
        	src: ['bower_components/themify-icons/fonts/*']
        }, {
        	expand: true,
        	flatten: true,
        	cwd: '<%= yeoman.app %>',
        	dest: '<%= yeoman.dist %>/assets/fonts',
        	src: ['bower_components/font-awesome/fonts/*']
        }, {
            expand: true,
            flatten: true,
            cwd: '<%= yeoman.app %>',
            dest: '<%= yeoman.dist %>/scripts',
            src: ['scripts/config*.js']
        }]
    },
    fonts: {
    	expand: true,
    	flatten: true,
    	cwd: '<%= yeoman.app %>',
    	dest: '<%= yeoman.dist %>/assets/fonts',
    	src: ['bower_components/font-awesome/fonts/*']
    },
    styles: {
    	expand: true,
    	cwd: '<%= yeoman.app %>/assets/css',
    	dest: '.tmp/assets/css',
    src: '{,*/}*.css'
}
};
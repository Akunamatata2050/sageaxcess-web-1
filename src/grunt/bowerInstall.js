module.exports = {
	app: {
		src: ['<%= yeoman.app %>/index.html'],
		ignorePath: '<%= yeoman.app %>/',
        // we're not going to inject these as they're lazyloaded
        exclude: ['requirejs',
        'mocha',
        'jquery.vmap.europe.js',
        'jquery.vmap.usa.js',
        'Chart.min.js',
        'raphael',
        'morris',
        'jquery.inputmask',
        'jquery.validate.js',
        'jquery.stepy.js',
        'fullcalendar.js'
        ]
    }
};
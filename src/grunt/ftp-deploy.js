module.exports = function(grunt) {

	exclusions = function() {

		var setup = grunt.option('setup') || false;
		var setup_exclusions = ['./dist/**/*.DS_Store', './dist/fonts/themify-icons/SVG', './dist/fonts/themify-icons/demo-files', './dist/fonts/themify-icons/ie7', './dist/styles/ui/images/flags'];
		var non_setup_exclusions = ['./dist/bower_components'];
		var exclusions = [];
		if (!setup) {
			exclusions = setup_exclusions.concat(non_setup_exclusions);
		} else {
			exclusions = setup_exclusions;
		}

		return exclusions;
	};

	return {
		dev: {
			auth: {
				host: 'sageaxcess.hostedftp.com',
				port: 21,
				authKey: 'dev'
			},
			authPath: './.ftppass',
			src: './dist',
			dest: '/sageaxcess-web',
			exclusions: exclusions()
		},
		prod: {
			auth: {
				host: '10.10.5.228',
				port: 21,
				authKey: 'production'
			},
			authPath: './.ftppass',
			src: './dist',
			dest: '/sageaxcess-web',
			exclusions: exclusions()
		}
	};

};
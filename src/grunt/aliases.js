module.exports = function(grunt) {
	var target = grunt.option('target') || 'apiary';

	return {
		'docs': [
			'connect:docs', 'open', 'watch'
		],

		'server': ['serve'],
		'serve': ['clean:server', 'ngconstant:'+target, 'concurrent:server', 'configureProxies:server', 'connect:livereload', 'open', 'watch'],
    'background-server': ['clean:server', 'ngconstant:'+target, 'concurrent:server', 'configureProxies:server', 'connect:livereload'],
		'build': ['clean:dist', 'useminPrepare', 'concurrent:dist', 'copy:dist', 'cssmin', 'concat', 'uglify', 'usemin'],
		'default': ['server'],
		'deploy': ['build', 'ftp-deploy:'+target],
		'test': ['background-server', 'shell:clearNightmare', 'shell:runTests'],
    'test:watch': ['background-server', 'shell:clearNightmare', 'shell:runTestsAndWatch']
	};
};

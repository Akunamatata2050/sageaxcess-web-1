module.exports = {
	server: [
	'less:server',
	'copy:styles'
	],
	test: [
	'copy:styles'
	],
	dist: [
	'less:server',
	'copy:styles',
	'copy:dist',
        // 'imagemin',
        // 'svgmin'
        ]
    };
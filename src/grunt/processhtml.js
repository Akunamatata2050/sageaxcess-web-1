module.exports = {
	options: {
		commentMarker: 'prochtml',
		process: true
	},
	dist: {
		files: {
			'<%= yeoman.dist %>/index.html': ['<%= yeoman.dist %>/index.html']
		}
	}
};
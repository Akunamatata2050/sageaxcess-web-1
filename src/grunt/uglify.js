module.exports = {
	options: {
		mangle: false,
		compress: {
			drop_console: true
		}
	},
	dist: {
		files: {
			"<%= yeoman.dist %>/scripts/app.js": [".tmp/**/*.js", "<%= yeoman.app %>/scripts/**/*.js", "!<%= yeoman.app %>/scripts/vendors/**"]
		}
	}
};
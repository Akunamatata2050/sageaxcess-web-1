module.exports = {
	dist: {
		files: [{
			dot: true,
			src: [".tmp", "<%= yeoman.dist %>/*", "!<%= yeoman.dist %>/.git*"]
		}]
	},
	all: [".tmp", ".sass-cache", ".DS_Store", "client/bower_components", "documentation/jade", "documentation/config.codekit", "landing/jade", "landing/config.codekit", "node_modules", ".git"],
	server: ".tmp"
};
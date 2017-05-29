module.exports = function(grunt, data) {
	return {
		options: {
			port: 9000,
			hostname: "localhost"
		},
		proxies: [{
			context: '/api',
			host: '192.168.1.2',
			/*host: '52.20.47.134',*/
			https: false,
			changeOrigin: true,
			rewrite: {
				'^/api': ''
			}
		}],
		livereload: {
			options: {
				middleware: function(connect) {
					var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;
					return [proxySnippet, data.yeoman.lrSnippet, data.yeoman.mountFolder(connect, ".tmp"), data.yeoman.mountFolder(connect, data.yeoman.app)];
				}
			}
		},
		docs: {
			options: {
				middleware: function(connect) {
					return [data.yeoman.lrSnippet, data.yeoman.mountFolder(connect, data.yeoman.docs)];
				}
			}
		},
		test: {
			options: {
				middleware: function(connect) {
					return [data.yeoman.mountFolder(connect, ".tmp"), data.yeoman.mountFolder(connect, "test")];
				}
			}
		},
		dist: {
			options: {
				middleware: function(connect) {
					return [data.yeoman.mountFolder(connect, data.yeoman.dist)];
				}
			}
		}
	};

};
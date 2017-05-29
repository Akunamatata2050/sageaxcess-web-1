module.exports = {
	options: {
		sassDir: "<%= yeoman.app %>/styles",
		cssDir: ".tmp/styles",
		generatedImagesDir: ".tmp/styles/ui/images/",
		imagesDir: "<%= yeoman.app %>/styles/ui/images/",
		javascriptsDir: "<%= yeoman.app %>/scripts",
		fontsDir: "<%= yeoman.app %>/fonts",
		importPath: "<%= yeoman.app %>/bower_components",
		httpImagesPath: "styles/ui/images/",
		httpGeneratedImagesPath: "styles/ui/images/",
		httpFontsPath: "fonts",
		relativeAssets: true
	},
	dist: {
		options: {
			outputStyle: 'compressed',
			debugInfo: false,
			noLineComments: true
		}
	},
	server: {
		options: {
			debugInfo: true
		}
	},
	forvalidation: {
		options: {
			debugInfo: false,
			noLineComments: false
		}
	}
};
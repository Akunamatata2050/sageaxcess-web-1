module.exports = {
	app: {
		src:      'client/views/templates/**.html',
		dest:     'client/scripts/core/modules/templates.js',
		options:  {
			url:    function(url) { return url.replace('client/views/', ''); },
			bootstrap: function(module, script) {
				return '/* jshint ignore:start */\nangular.module(\'theme.core.templates\', []).run([\'$templateCache\', function ($templateCache) {\n'+script+'}])\n/* jshint ignore:end */';
			}
		},
	}
};
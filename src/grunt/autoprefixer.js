module.exports = {
	options: {
		browsers: ['last 1 version']
	},
	dist: {
		files: [{
			expand: true,
			cwd: '.tmp/assets/css/',
		src: '{,*/}*.css',
		dest: '.tmp/assets/css/'
	}]
}
};
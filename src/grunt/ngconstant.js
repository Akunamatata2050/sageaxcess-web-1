/**
These settings are supposed to be used for local development.
Full application deployments still need these properties which will be provided during
full application deployment via lanuch repo run script -e (environment) option.
**/
module.exports = {
	options: {
		space: '  ',
		wrap: '\'use strict\';\n\n {%= __ngModule %}',
		name: 'config'
	},
	apiary: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'apiary',
				apiEndpoint: 'http://private-c622-sageaxcess.apiary-mock.com',
				pusherKey: '3ea0911334b61a35ba30',
				debugEnabled: true
			}
		}
	},
	local: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'local',
				apiEndpoint: 'http://localhost',
				pusherKey: '3ea0911334b61a35ba30',
				debugEnabled: true
			}
		}
	},
	jay: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'jay',
				apiEndpoint: 'http://192.168.99.100:9000/api',
				pusherKey: '3ea0911334b61a35ba30'
			}
		}
	},
	stage: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'stage',
				apiEndpoint: 'https://stage.sageaxcess.com/api',
				pusherKey: '3ea0911334b61a35ba30',
				debugEnabled: true
			}
		}
	},
	production: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'production',
				apiEndpoint: 'https://aegis.sageaxcess.com/api',
				pusherKey: '3ea0911334b61a35ba30'
			}
		}
	},
	devTest: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'devTest',
				apiEndpoint: 'http://52.91.187.213:9000/api',
				pusherKey: '3ea0911334b61a35ba30'
			}
		}
	},
  drone: {
		options: {
			dest: '<%= yeoman.app %>/scripts/config.js'
		},
		constants: {
			ENV: {
				name: 'drone',
				apiEndpoint: 'http://web.internal:8000/api',
				pusherKey: '3ea0911334b61a35ba30'
			}
		}
	},
  localDev: {
    options: {
      dest: '<%= yeoman.app %>/scripts/config.js'
    },
    constants: {
      ENV: {
        name: 'localDev',
        apiEndpoint: 'http://127.0.0.1:5000',
        pusherKey: '3ea0911334b61a35ba30'
      }
    }
  },
  ubuntu: {
    options: {
      dest: '<%= yeoman.app %>/scripts/config.js'
    },
    constants: {
      ENV: {
        name: 'ubuntu',
        apiEndpoint: 'http://10.211.55.12:9000/api',
        pusherKey: '3ea0911334b61a35ba30'
      }
    }
  },
  demo: {
    options: {
      dest: '<%= yeoman.app %>/scripts/config.js'
    },
    constants: {
      ENV: {
        name: 'demo',
        apiEndpoint: 'https://demoapi.changedynamix.io',
        pusherKey: '3ea0911334b61a35ba30'
      }
    }
  }
};

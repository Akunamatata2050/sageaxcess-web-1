# sageaxcess-web
[![Build Status](https://dev-drone.sageaxcess.com/api/badges/SageAxcess/sageaxcess-web/status.svg)](https://dev-drone.sageaxcess.com/SageAxcess/sageaxcess-web)

The SageAxcess web application

Dependency:
---------------------------------
1. npm
2. grunt
3. bower
4. Install compass from here: http://compass-style.org/install/

Development Setup
----------------------------------
1. Checkout source
2. cd {PROJECT_ROOT}/src
3. Run "npm install"
4. Run "bower install"
5. Run "grunt serve --target=<env>" to bring up the application. env values are apiary, dev, stage etc...
	
Note: Livereload automatically refreshes the page as you make changes in development mode.

Deployment Setup
------------------------------------
1. Checkout source or pull latest if the project is already checkedout.
2. cd {PROJECT_ROOT}/src
3. Execute run.sh in the following format:
	run.sh -r <router_ip> -h <host_port> -c <container_port> -v -e <environment> -p	

Note: 

1. By default router_ip is localhost, host_port is 9000 and container_port is 9000
2. Use -p (pull) option to delete the local image and get latest from docker hub
3. Use run.sh -u to know more about the usage of the script
4. Use -e to specifiy which environment you want to run the image. By default dev is the 
   target environment. The environment values must be specified in ng-constant.js and aliases.js during image building. 

Environment Variables
--------------------------------------
This project uses grunt-ng-constant to manage environment variables. 

During development phase all "development" properties are copied to {PROJECT_ROOT}/src/client/scripts/config.js. 

During deploment phase all "prduction" properties are copied to {PROJECT_ROOT}/src/client/scripts/config.js. 

This module is integrated to the application so any constants defined in {PROJECT_ROOT}/src/Gruntfile.coffee are available in the application via "ENV" injection.


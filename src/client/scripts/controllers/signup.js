(function() {
	'use strict';
	angular.module('theme.core.main_controller').
	controller('SignUpCtrl', SignUpCtrl);

	SignUpCtrl.$inject = ['$scope', '$rootScope', 'SessionService', '$location', '$timeout', '$window', 'UI'];

	function SignUpCtrl($scope, $rootScope, SessionService, $location, $timeout, $window, UI) {
		var vm = this;

		vm.signup = signup;	
		vm.closeAlert=closeAlert;	

		var loginHandler, errorHandler;

		function signup(event, form) {			
			form.$setDirty();
			if (form.$invalid) {
				form.email.$setDirty();
				form.orgName.$setDirty();
				UI.shake(event.target);
			}
			else {
				vm.saving=true;
				return SessionService.signup({
					'email': vm.email,
					'OrganizationName' : vm.OrganizationName
				}, function(){
					vm.saving=false;
					vm.confirmation=true;
				}, errorHandler);
			}
		}

		loginHandler = function() {
			if (SessionService.isAuthorized()) {
				$scope.$emit('getUser');
				var requestedPath = $rootScope.returnToState;
				var requestedPathId = $rootScope.returnToStateParams;
				if (requestedPath && requestedPathId) {
					requestedPath += requestedPathId;
				}

				if (requestedPath) {
					$location.path(requestedPath);
				} else {
					$location.path('/dashboard');
				}

				$timeout(function() {
					$window.location.reload();
				}, 500);
			} else {
				vm.alerts = [];
				vm.alerts.push({
					'msg': 'Error! Unknown error occured, please try again.',
					'type': 'danger'
				});
			}
		};

		errorHandler = function(resp) {
			vm.saving=false;

			vm.alerts = [];
			if(resp.data && resp.data.error && resp.data.errorCode===600){

				vm.alerts.push({
					'msg': 'Email already in use.',
					'type': 'danger'
				});
			} else{
				vm.alerts.push({
					'msg': 'Error! Unknown error occured, please try again.',
					'type': 'danger'
				});
			}
		};
		
		function closeAlert(index) {
			vm.alerts.splice(index, 1);
		}		
	}

}).call(this);
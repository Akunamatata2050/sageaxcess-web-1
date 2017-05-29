(function() {
	'use strict';
	angular.module('app')
	.factory('PusherService', ['$rootScope', 'ENV', function($rootScope, ENV) {
		var pusher;
		var channels = {};
		return {

			subscribeAndBind: function(channelName, eventName, callback) {
				pusher = pusher || new Pusher(ENV.pusherKey);
				var channel;			
				
				if (typeof pusher.channel(channelName) !== 'undefined') {
					channel = channels[channelName];
					channel.unbind(eventName);
					channel.bind(eventName, function(msg) {
						$rootScope.$apply(function() {
							callback(msg);
						});
					});
				} else {
					channel = pusher.subscribe(channelName);
					channels[channelName] = channel;
					channel.bind('pusher:subscription_error', function() {
						console.log('Pusher channel '+channelName+' subscription failed!');
					});
					channel.bind('pusher:subscription_succeeded', function() {
						console.log('Pusher channel '+channelName+' subscription successful.');
						channel.bind(eventName, function(msg) {
							$rootScope.$apply(function() {
								callback(msg);
							});
						});
					});
				}

				//console.log(channels);
			}
		};
	}]);

}).call(this);
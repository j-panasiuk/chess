'use strict';

app.controller('mainController', function($scope, settings, rules, game) {
	console.log('Main Controller loaded.');

	$scope.$on('changeDebugVisibility', function(event, show) {
		console.assert((show === true) || (show === false), 'Invalid event `show` parameter', show);
		console.debug('Setting debug visibility', show);
		$scope.$broadcast('setDebug', show);
	});

	setTimeout(function init() {
		console.log('Broadcasting...');
		$scope.$broadcast('start');
	}, 200);
});

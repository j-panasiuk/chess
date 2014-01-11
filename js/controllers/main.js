'use strict';

app.controller('mainController', function($scope, settings, rules, game) {
	console.log('%cLoading mainController...', LOG.action);

	$scope.$on('changeDebugVisibility', function(event, show) {
		console.assert((show === true) || (show === false), 'Invalid event `show` parameter', show);
		console.debug('Setting debug visibility', show);
		$scope.$broadcast('setDebug', show);
	});

	setTimeout(function init() {
		console.log('%c\nSTART GAME\n', LOG.action);
		$scope.$broadcast('start');
	}, 200);
});

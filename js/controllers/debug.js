'use strict';

app.controller('debugController', function($scope, settings) {
	console.log('Debug Controller loaded.');

//	** DEBUGGING TOOLS
//	-----------------------------------------------------

	$scope.setDebug = function(show) {
		console.assert((show === true) || (show === false), 'Invalid `show` argument.', show);
	//	setDebug(true): Triggers event notifying debug UI to show.
	//	setDebug(false): Calls debug UI elements to hide.
		settings.debugMode = !!show;
		$scope.$emit('changeDebugVisibility', show);
	};
	$scope.updateDebug = function(toggle) {
	//	updateDebug(true): Toggle debug UI visibility.
	//	updateDebug(false): Refresh debug UI.
		if (toggle) {
			settings.debugMode = !settings.debugMode;
		}
		$scope.setDebug(settings.debugMode);
	};

});
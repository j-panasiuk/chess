'use strict';

app.controller('boardController', function($scope, settings, rules, game) {
	$scope.$on('$viewContentLoaded', function() {
		console.log('Board content loaded.');
	});
});
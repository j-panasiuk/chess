'use strict';

app.controller('mainController', function($scope, $timeout, settings, rules, game) {
	console.log('%cLoading mainController...', LOG.action);

	$scope.startGame = function(restart) {
		console.log('%c\nSTART GAME\n', LOG.action);
	//	restart == false: Start first game. Game model is already up-to-date.
	//	restart == true: Restart game with current settings. Model update needed.
		if (restart) {
			game.initialize();
			console.log('%cSetting up starting position...', LOG.action, game.currentPosition);
		}			
		$scope.$broadcast('startGame', !!restart);
	};

	$scope.$on('gameOver', function(event, result) {
		$timeout(function() {
			$scope.startGame(true);
		}, 1500);
	});

	$timeout(function initialize() {
		$scope.startGame(false);
	}, 200);


});

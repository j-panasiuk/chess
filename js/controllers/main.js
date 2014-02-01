'use strict';

app.controller('mainController', function($scope, $timeout, settings, rules, game) {
	console.log('%cLoading mainController...', LOG.action);

	$scope.startGame = function(restart) {
		console.log('%c\nSTART GAME\n', LOG.action);
	//	restart == false: Start first game. Game model is already up-to-date.
	//	restart == true: Restart game with current settings. Model update needed.
		if (restart) {
		//	Depending on current settings, switch colors / reverse chessboard.
			if (settings.switchColorOnRestart) {
				settings.switchControls();
				console.log('%cSwitching sides...', LOG.action, settings);
			}
			game.initialize();
			console.log('%cSetting up starting position...', LOG.action, game.currentPosition);
		}			
		$scope.$broadcast('startGame', !!restart);
	};

	$scope.$on('gameOver', function(event, result) {
		console.log('%cGame Over:', LOG.attention, result);
		$scope.$digest();
		console.debug('%ccurrentPosition:', LOG.attention, game.currentPosition);
	});

	$scope.$on('restart', function() {
		$timeout(function() {
			$scope.startGame(true);
		}, 100);		
	});

	$timeout(function initialize() {
		$scope.startGame(false);
	}, 100);


});

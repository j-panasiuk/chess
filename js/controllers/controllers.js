'use strict';

app.controller('chessboardController', function($scope, settings, rules, game) {

	console.log('Board controller ready.');

	setTimeout(function letsRoll() {
		$scope.displayPieces($scope.game.currentPosition);
		$scope.enableDragDrop();
		$scope.enableSelect(0);
		console.log('Let\'s Roll!');
	}, 1500);

});
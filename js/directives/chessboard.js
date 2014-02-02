'use strict';

app.directive('chessboard', function($timeout, $animate, settings, rules, game, engine) {
	function linkChessboard(scope, element, attributes) {

		scope.enableSquareSelect = function(squares) {
			console.assert((squares === undefined) || (_.isArray(squares) && squares.every(function(square) { 
				return square.onBoard; })), 'Invalid square array.', squares);
		//	Allow user to select squares from the given set.
		//	If no set of squares is provided, allow selecting all squares.
		//	squares: 	array of square codes [1, 3, 55, 76...] or undefined
		//
			scope.selectableSquares = squares ? _.union(scope.selectableSquares || [], squares) : rules.SQUARES;
		};

		scope.disableSquareSelect = function(squares) {
			console.assert((squares === undefined) || (_.isArray(squares) && squares.every(function(square) { 
				return square.onBoard; })), 'Invalid square array.', squares);
		//	Disable selecting squares from the given set.
		//	If no set of squares is provided, disable all squares.
		//	squares: 	array of square codes [1, 3, 55, 76...] or undefined
		//
			scope.selectableSquares = squares ? _.difference(scope.selectableSquares || [], squares) : [];
		};

		scope.enablePieceSelect = function(color) {
		//	Allow user to select pieces of the given color. Disable selecting other pieces.
		//	If no color is provided, allow selecting any piece.
		//	color: 		0 = white 	1 = black 	undefined = white and black
		//
			var colorName = rules.COLOR_NAME[color] || null;
			console.log('%cEnabling selection...', LOG.ui, colorName);

			if (colorName) {
				scope.selectablePieces = game.currentPosition.pieceLists[color];
			} else {
				scope.selectablePieces = game.currentPosition.pieceLists.all;
			}
		};

		scope.disablePieceSelect = function(color) {
		//	Disable picking pieces of the given color (if given).
		//	If no color is provided, disable all selection.
		//	color: 		0 = white 	1 = black 	undefined = white and black
		//
			var colorName = rules.COLOR_NAME[color] || null;
			console.log('%cDisabling selection...', LOG.ui, colorName || 'all pieces');

			if (colorName) {
				scope.selectablePieces = scope.selectablePieces.filter(function(piece) {
					return piece.color !== color;
				});
			} else {
				scope.selectablePieces = [];
			}			
		};

		scope.reverse = function(isReversed) {
			console.assert((typeof isReversed === 'boolean') || (isReversed === undefined), 'Invalid isReversed value.');
			console.log('%cReversing chessboard...', LOG.ui);
		//	Reverse chessboard. Adjust positions of all squares and pieces.
			var elements = angular.element('.square, .piece');
			switch (isReversed) {
				case true: 		elements.addClass('reversed'); break;
				case false: 	elements.removeClass('reversed'); break;
				default: 		elements.toggleClass('reversed');
			}
		};

		console.log('%cChessboard linked.', LOG.ui);
	}
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-chessboard.html',
		link: linkChessboard
	};
});

app.directive('square', function(settings) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-square.html',
		scope: {
			square: '=square',
			isSelectable: '=selectable'
		},
		link: function(scope) {
			scope.settings = settings;
			scope.square = +scope.square;
			scope.state = scope.$parent.squaresState[scope.square];

			scope.select = function handleSquareClick() {
				if (scope.isSelectable) {
					scope.$parent.handleSquareSelect(scope.square);
				}
			};
		}
	};
});

app.directive('piece', function(settings, rules, game) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-piece.html',
		scope: {
			piece: '=ngModel',
			isSelectable: '=selectable',
			isSelected: '=selected'
		},
		link: function(scope, element) {
			scope.settings = settings;
			scope.color = rules.COLOR_NAME[scope.piece.color];

			scope.select = function handlePieceClick() {
				if (scope.isSelectable) {
					scope.$parent.handlePieceSelect(scope.piece);
				} else if (scope.$parent.isSelectableSquare(scope.piece.square)) {
					scope.$parent.handleSquareSelect(scope.piece.square);
				}				
			};
		}
	};
});
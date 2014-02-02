'use strict';

app.directive('chessboard', function($timeout, $animate, settings, rules, game, engine) {
	function linkChessboard(scope, element, attributes) {
		console.log('Linking position:', scope.position);

		//scope.settings = settings;
		//scope.rules = rules;
		//scope.game = game;
		//scope.engine = engine;
		//scope.squares = rules.SQUARES;
		//scope.pieces = scope.position.pieceLists.all;

		scope.enableSquareSelect = function(selector) {
			console.assert((selector instanceof jQuery) || (selector === undefined), 'Invalid square selector.');
		//	Allow user to select squares from the given set.
		//	If no set of squares is provided, allow selecting all squares.
		//	selector: 	jQuery selector or undefined
		//
			var squareSelector = selector || angular.element('.square');

			squareSelector.addClass('selectable');
		};

		scope.disableSquareSelect = function(selector) {
			console.assert((selector instanceof jQuery) || (selector === undefined), 'Invalid square selector.');
		//	Disable selecting squares from the given set.
		//	If no set of squares is provided, disable all squares.
		//	selector: 	jQuery selector or undefined
		//
			var squareSelector = selector || angular.element('.square');

			squareSelector.removeClass('selectable');
		};

		scope.enablePieceSelect = function(color) {
		//	Allow user to select pieces of the given color. Disable selecting other pieces.
		//	If no color is provided, allow selecting any piece.
		//	color: 		0 = white 	1 = black 	undefined = white and black
		//
			var colorName = rules.COLOR_NAME[color] || null;

			if (colorName) {
				angular.element('.piece').each(function() {					
					if (angular.element(this).hasClass(colorName)) {
						angular.element(this).addClass('selectable');
					} else {
						angular.element(this).removeClass('selectable');
					}					
				});
			} else {
				angular.element('.piece').addClass('selectable');
			}
		};

		scope.disablePieceSelect = function(color) {
		//	Disable picking pieces of the given color (if given).
		//	If no color is provided, disable all selection.
		//	color: 		0 = white 	1 = black 	undefined = white and black
		//
			var colorName = rules.COLOR_NAME[color] || null;

			if (colorName) {
				angular.element('.piece.' + colorName).removeClass('selectable');					
			} else {
				angular.element('.piece').removeClass('selectable');
			}
		};

		scope.enableTargetSelect = function(square) {
		//	Piece has been selected. Allow selecting any square, which is accessible to
		//	selected piece. Disable selecting remaining squares.
		//
			var selectedMove, 
				targets = scope.legalTargets[square];

			console.log('%cPossible targets:', LOG.ui, targets);
			angular.element('.square').each(function() {
				if (_.contains(targets, +this.id)) {
					angular.element(this).addClass('selectable').bind('click', function() {
					//	A move has been selected.
						selectedMove = scope.legalMoves[+square][+this.id];						
						scope.handleMove(selectedMove);
					});
				} else {
					angular.element(this).removeClass('selectable').unbind('click');
				}
			});
		};

		scope.cleanupMove = function() {
			angular.element('.piece').removeClass('selected');
		};

		/*
		scope.displayDirectMove = function(move) {
		//	Display movement of selected piece.
		//	Applies to AI and remote players.
		//	Doesn't apply to user selecting moves via DragDrop (the piece is already moved),
		//	but applies to other forms of move selection (via click, console).
			var pieceElement;
			$('.piece').each(function() {
				if (+$(this).attr('at') === move.from) {
					pieceElement = $(this);
					return false;
				}
			});
			scope.movePiece(pieceElement, move.to);
		};
		*/

		/*
		scope.movePiece = function(pieceSelector, square) {
			console.assert((pieceSelector instanceof jQuery) && (pieceSelector.length === 1), 'Invalid piece selector.');
			console.assert(square.onBoard, 'Invalid move data.', square);
		//	pieceSelector: 		jQuery selector with a single piece element.
		//	square: 			int target square code [0..119].
		//
			console.log('%cAnimating movement to...', LOG.ui, square);
		};
		*/

		/*
		scope.cleanupMove = function(move) {
		//	Add drag functionality to promoted piece.
			if (move.isPromote) {
				$('.piece').each(function() {
					if (!$(this).hasClass('ui-draggable')) {
						console.log('%cSetting drag on a piece...', LOG.action);
						scope.enableDrag($(this));
						return false;
					}
				});
			}
		};
		*/

		scope.reverse = function(isReversed) {
			console.assert((typeof isReversed === 'boolean') || (isReversed === undefined), 'Invalid isReversed value.');
			console.log('%cReversing chessboard...', LOG.ui);
		//	Reverse chessboard. Adjust positions of all squares and pieces.
		//	Reset jQuery UI styles responsible for positioning animated elements.
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
		//scope: {
		//	position: '=ngModel'
		//},
		link: linkChessboard
	};
});

app.directive('square', function(settings) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-square.html',
		scope: {
			square: '=square'
		},
		link: function(scope) {
			scope.settings = settings;
			scope.square = +scope.square;
			scope.state = scope.$parent.squaresState[scope.square];
		}
	};
});

app.directive('piece', function(settings, rules) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-piece.html',
		scope: {
			piece: '=ngModel'
		},
		link: function(scope, element) {
			scope.settings = settings;
			scope.color = rules.COLOR_NAME[scope.piece.color];

			scope.select = function() {
				scope.$parent.enableTargetSelect(+scope.piece.square);
				element.addClass('selected');
			};
		}
	};
});
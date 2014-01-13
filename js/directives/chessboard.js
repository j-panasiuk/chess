'use strict';

app.directive('chessboard', function(settings, rules, game) {
	function linkChessboard(scope, element, attributes) {
		scope.rules = rules;
		scope.game = game;

		scope.squareColor = function(square) {
			return square.complex;
		};

		scope.displayPieces = function(position) {
		//	DEPENDENCIES: [jQuery UI]
			console.assert(position.fen.match(rules.validFen), 'Invalid position (FEN).', position.fen);
			console.log('%cDisplaying pieces...', LOG.ui);
		//	Display pieces to match current position.
		//	<div.chessboard>
		//		<div class='square' id={{code}}> (x64)
		//		<div class='piece {{color}} {{type}}'></div> (x32)
		//	</div>
		//	Pieces are represented by divs (children of div.chessboard).
		//	For each piece in play adjust its position, by setting css `position` attribute.
		//	
		//	Add .data('square') token to mark piece's current square.
		// 	For king occupying e1 square: $('.white.king').data('square') == 4
			var piece, square, pieceElement, squareElement,
				pieces = position.pieceLists.all,
				pieceElements = $('.piece');
			for (var i = 0; i < pieces.length; i++) {
				piece = pieces[i];
				square = piece.square;	
				pieceElement = $(pieceElements[i]);
				squareElement = $('#' + square);
			//	[jQuery UI] position		
				pieceElement.position({ 			
					'of': squareElement,
					'my': 'left top',
					'at': 'left top'
				})
				.removeClass('invisible')
				.data('square', +(square));			
			}
		};

		scope.enableDragDrop = function() {
		//	DEPENDENCIES: [jQuery UI]
		//	Define drag behavior.
			$('.piece').draggable({
				containment: '#body-container',
				cursor: 'none',
				helper: 'original',			// draggedPiece | "original" | "clone"
				revert: 'invalid',			// true | false | "invalid" | "valid"
				revertDuration: 0,
				stack: '.piece',
				start: function(event, ui) {
				//	User starts to drag a piece.
				//	Look up legalTargets array for a list of legal target squares.
				//	Enable drop for each legal square. Disable all other squares.
					var square = $(this).data('square'),
						targets = scope.legalTargets[square];
					
					$('.square').each(function() {						
						if (targets.indexOf(+(this.id)) > -1) {
							$(this).droppable('enable');
						} else {
							$(this).droppable('disable');
						}
					});					
				},
				stop: function(event, ui) {
				//	Dragging has stopped. Revert all temporary dragging functionalities.
					$('.square').droppable('disable')
					.removeClass('drag-hover')
					.removeClass('ui-state-highlight');
				}
			});
		//	Define drop behavior.	
			$('.square').droppable({
				accept: '.piece',
				activeClass: 'ui-state-highlight',
				drop: function(event, ui) {
				//	Handle piece drop event. Deal with user inteface only, 
				//	leaving further updates to handleMove() function.
				//	1.	Adjust position of the dropped piece to fit the square.
				//	2.	Update .data('square') token to new square index.
				//	3.	Find the move in legalMoves array. 
					var move, 
						pieceElement = $(ui.draggable),
						from = pieceElement.data('square'),
						to = +(this.id),
						squareElement = $('#' + to);

					pieceElement.position({
						'of': squareElement,
						'my': 'left top',
						'at': 'left top'
					})
					.data('square', to);

					$('.piece').draggable('disable');
					$('.square').droppable('disable');

					move = scope.legalMoves[from][to];
					scope.handleMove(move);
				},
				deactivate: function(event, ui) { $(this).removeClass("drag-hover"); },
				out: function(event, ui) { $(this).removeClass("drag-hover"); },
				over: function(event, ui) {	$(this).addClass("drag-hover");	}
			});
		//	Disable drag & drop until player is allowed to move.
			scope.disableSelect();
		};

		scope.enableSelect = function(color) {
			console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		//	Allow picking pieces of the given color.
			color = rules.COLOR_NAME[color];
			$('.piece.' + color).draggable('enable');
		};

		scope.disableSelect = function(color) {
		//	Disable picking pieces of the given color (if given).
		//	If no color is provided, disable all selection.
			if (rules.COLORS.indexOf(color) > -1) {
				$('.piece.' + color).draggable('disable');
			} else {
				$('.piece').draggable('disable');
				$('.square').droppable('disable');
			}
		};

		scope.displayDirectMove = function(move) {
		//	Display movement of selected piece.
		//	Applies to AI and remote players.
		//	Doesn't apply to user selecting moves via DragDrop (the piece is already moved),
		//	but applies to other forms of move selection (via click, console).
			var pieceElement;
			$('.piece').each(function() {
				if ($(this).data('square') === move.from) {
					pieceElement = $(this);
					return false;
				}
			});
			scope.movePiece(pieceElement, move.to);
		};

		scope.cleanupMove = function(move) {
			console.assert(move.requiresCleanup, 'No cleanup necessary.', move.notation);
		//	Necessary display (DOM) cleanup after weird moves.
		//	1.	Removes captured piece from DOM.
		//	2.	Moves castling rook (this includes updating rook's .data('square')).
		//	3.	Changes avatar of promoted pawn.
			var side, castle, 
				color = rules.COLOR_NAME[move.color], 
				enemy = rules.COLOR_NAME[rules.opposite(move.color)];

			if (move.isCapture) {
				if (!move.isEnpassant) {
					$('.piece.' + enemy).each(function() {
						if ($(this).data('square') === move.to) {
							console.log('%cCAPTURE!\tGoodbye piece!', LOG.ui, this);
							$(this).remove();
							return false;
						}
					});
				} else {
					$('.piece.' + enemy + '.pawn').each(function() {
						if ($(this).data('square') === rules.ENPASSANT_TARGET[move.to]) {
							console.log('%cEN PASSANT!\tGoodbye pawn!', LOG.ui, this);
							$(this).remove();
							return false;
						}
					});
				}
			} else if (move.isCastle) {
				side = move.special - 2;
				castle = rules.CASTLE_ROOKS[move.color][side];
				$('.piece.' + color + '.rook').each(function() {
					if ($(this).data('square') === castle.from) {
						console.log('%cCASLTE!\tGo rook!', LOG.ui, side);
						scope.movePiece($(this), castle.to);
						return false;
					}
				});
			}
			if (move.isPromote) {
				$('.piece').promise().done(function() {
					$('.piece.' + color + '.pawn').each(function() {
						var pieceName;
						if ($(this).data('square') === move.to) {
							pieceName = rules.PIECE_NAME[move.promote];
							$(this).removeClass('pawn').addClass(pieceName);
						}
					});
				});
			}
			console.log('%cDisplay cleanup complete.', LOG.ui);
		};

		scope.movePiece = function(pieceElement, square) {
			console.assert(pieceElement instanceof jQuery, 'Invalid move data.', pieceElement);
			console.assert(square.onBoard, 'Invalid move data.', square);
		//	Move piece div on the user interface. Adjust .data('square') accordingly.
		//	(Doesn't perform any "smart" cleanup, like moving castling rooks, or removing
		//	captured pieces. Doesn't change avatars of promoted pawns either.
		//	For the display cleanup check the cleanupMove() function).
		//	pieceElement: 		jQuery selector with piece in question
		//	square: 			int index [0..119]
			var squareElement = $('#' + square), 
				animate = settings.animationTime;

			pieceElement.position({
				'of': squareElement,
				'my': "left top",
				'at': "left top",
				'using': (animate) ? function(css, duration) {
			        pieceElement.animate(css, animate, "linear");
			    } : null
			})
			.data('square', square);
		};

		scope.displaySubscripts = function(show) {
		//	Show or hide debugging subscripts.
		//	Shows subscripts unless explicitly provided with show === false.
		//	show: 		true | false
			var show = (show !== false) ? true: false;
			if (show) {
				$('.debug.subscript').show();
			} else {
				$('.debug.subscript').hide();
			}
		};
		scope.displayOutlines = function(show) {
		//	Show or hide debugging square outlines.
		//	Shows outlines unless explicitly provided with show === false.
		// 	show: 		true | false
			var show = (show !== false) ? true : false;
			if (show) {
				$('.debug.square-outline').show();
			} else {
				$('.debug.square-outline').hide();
			}
		};

		console.log('%cChessboard linked.', LOG.ui);
	}
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-chessboard.html',
		link: linkChessboard
		//scope: {}
	};
});

/* DEBUG TOOLS */
app.directive('subscript.square', function() {
	return {
		restrict: 'A',
		replace: true,
		priority: 1,
		template: '<div class="debug subscript square-id unselectable">{{code}}</div>',
		scope: {
			code: '@'
		},
		controller: function($scope) {
			$scope.$on('setDebug', function(event, show) {
				if (show) {
					$scope.show();
				} else {
					$scope.hide();
				}
			});
		},
		link: function(scope, element) {
			scope.show = function() {
				element.show();
			};
			scope.hide = function() {
				element.hide();
			};
		}
	};
});

app.directive('subscript.piece', function() {
	return {
		restrict: 'A',
		replace: true,
		priority: 1,
		template: '<div class="debug subscript data unselectable">{{square || data}}</div>',
		scope: {
			data: '@'
		},
		controller: function($scope) {
			$scope.$on('setDebug', function(event, show) {
				if (show) {
					$scope.show();
				} else {
					$scope.hide();
				}
			});
		},
		link: function(scope, element) {
			scope.piece = element.parent();
			scope.square = scope.piece.data('square');
			scope.update = function() {
				scope.square = scope.piece.data('square');
				//scope.$digest();
			};
			scope.show = function() {
				element.show();
			};
			scope.hide = function() {
				element.hide();
			};
		//	Update piece subscript on element .data('square') change.
			scope.$watch(scope.square, scope.update());
		}
	};
});

app.directive('outline.square', function(game) {
	return {
		restrict: 'A',
		replace: true,
		priority: 1,
		template: '<div class="debug square-outline {{stateName(state)}}"></div>',
		scope: {
			code: '@',
			state: '@'
		},
		controller: function($scope) {
			$scope.$on('setDebug', function(event, show) {
				if (show) {
					$scope.show();
				} else {
					$scope.hide();
				}
			});
		},
		link: function(scope, element) {
			scope.stateName = function(state) {
				switch (+state) {
					case 1: 	return 'check';
					case 2: 	return 'pin';
					default: 	return '';
				}
			};
			scope.reset = function() {
				scope.state = 0;
			};
			scope.show = function() {
				element.show();
			};
			scope.hide = function() {
				element.hide();
			};	

			scope.$on('startGame', function(event, restart) {
				if (restart) {
					scope.reset();
				}
			});	
		}
	};
});
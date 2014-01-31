'use strict';

app.directive('chessboard', function($timeout, $animate, settings, rules, game) {
	function linkChessboard(scope, element, attributes) {

		scope.enableDragDrop = function() {
		//	Define drag & drop behavior for all pieces and squares.
		//	Disable dragging until player is allowed to move.
			var pieceElements = $('.piece'),
				squareElements = $('.square');

			scope.enableDrag(pieceElements);
			scope.enableDrop(squareElements);		
			scope.disableSelect();
		};

		scope.enableDrag = function(element) {
			console.assert(element instanceof jQuery, 'Invalid drag selector.');
		//	DEPENDENCIES: [jQuery UI]
		//	Define drag behavior on selected pieces.
			var element = element || $('.piece');

			element.draggable({
				containment: '#body-container',
				//cursor: 'none',
				helper: 'original',			// draggedPiece | "original" | "clone"
				revert: 'invalid',			// true | false | "invalid" | "valid"
				revertDuration: 0,
				stack: '.piece',
				start: function(event, ui) {
				//	User starts to drag a piece.
				//	Look up legalTargets array for a list of legal target squares.
				//	Enable drop for each legal square. Disable all other squares.
					var square = +$(this).attr('at'),
						targets = scope.legalTargets[square];
				
					console.log('%cDragging started...', LOG.ui, square);					
					$('.square').each(function() {						
						if (_.contains(targets, +this.id)) {
							$(this).droppable('enable');
						} else {
							$(this).droppable('disable');
						}
					});					
				},
				stop: function(event, ui) {
				//	Dragging has stopped. Revert all temporary dragging functionalities.
					console.log('%cDragging stopped.', LOG.ui, $(this).css('left'), $(this).css('top'));
					$(this).css('top', '').css('left', '').css('z-index', '');

					$('.square').droppable('disable')
					.removeClass('drag-hover')
					.removeClass('ui-state-highlight');
				}
			});
			console.log('%cSetting drag on pieces:', LOG.ui, element.length);
		};

		scope.enableDrop = function(element) {
			console.assert(element instanceof jQuery, 'Invalid drag selector.');
		//	DEPENDENCIES: [jQuery UI]
		//	Define drop behavior on selected squares.
			var element = element || $('.square');

			element.droppable({
				accept: '.piece',
				activeClass: 'ui-state-highlight',
				drop: function(event, ui) {
				//	Handle piece drop event. Deal with user inteface only, 
				//	leaving model updates to handleMove() function.
				//	1.	Snap dropped piece to fit target square.
				// 	2. 	Disable drag & drop until next player's turn.
				//	3.	Find and handle selected move in legalMoves array. 
					var move, 
						pieceElement = $(ui.draggable),
						from = +pieceElement.attr('at'),
						to = +this.id,
						squareElement = $('#' + to);

					console.log('%cSnapping dropped element...', LOG.ui, to);
					pieceElement.position({
						'of': squareElement,
						'my': 'left top',
						'at': 'left top'
					});

					scope.disableSelect();

					move = scope.legalMoves[from][to];
					scope.handleMove(move);
				},
				deactivate: function(event, ui) { $(this).removeClass("drag-hover"); },
				out: function(event, ui) { $(this).removeClass("drag-hover"); },
				over: function(event, ui) {	$(this).addClass("drag-hover");	}
			});
		}

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
				if (+$(this).attr('at') === move.from) {
					pieceElement = $(this);
					return false;
				}
			});
			scope.movePiece(pieceElement, move.to);
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
				duration = settings.animationTime;

			console.log('%cAnimating movement...', LOG.ui);
			pieceElement.position({
				'of': squareElement,
				'my': "left top",
				'at': "left top",
				'using': (duration) ? function(css, duration) {
			        pieceElement.animate(css, duration, "linear");
			    } : null
			});
		};

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

		scope.reverse = function(isReversed) {
			console.assert((typeof isReversed === 'boolean') || (isReversed === undefined), 'Invalid isReversed value.');
			console.log('%cReversing chessboard...', LOG.ui);
		//	Reverse chessboard. Adjust positions of all squares and pieces.
		//	Reset jQuery UI styles responsible for positioning animated elements.
			var elements = $('.square, .piece');
			switch (isReversed) {
				case true: 		elements.addClass('reversed'); break;
				case false: 	elements.removeClass('reversed'); break;
				default: 		elements.toggleClass('reversed');
			}
			elements.css('top', '').css('left', '');
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
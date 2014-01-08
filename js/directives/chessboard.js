'use strict';

app.directive('chessboard', function(rules, game) {
	function linkChessboard(scope, element, attributes) {
		scope.rules = rules;
		scope.game = game;
		scope.squareColor = function(square) {
			return ((square.rank + square.file) % 2) ? 'light' : 'dark';
		};
		scope.displayPieces = function(position) {
		//	DEPENDENCIES: [jQuery UI]
			console.assert(position.fen.match(rules.validFen), 'Invalid position (FEN).', position.fen);
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
						targets = $('.square');	//gui.legalTargets[square];
					
					targets.droppable('enable');
					//$('.square').each(function() {						
					//	if (targets.indexOf(+(this.id)) > -1) {
					//		$(this).droppable("enable");
					//	} else {
					//		$(this).droppable("disable");
					//	}
					//});					
				},
				stop: function(event, ui) {
				//	Dragging has stopped. Revert all temporary dragging functionalities.
					$('.square').droppable("disable")
					.removeClass("drag-hover")
					.removeClass("ui-state-highlight");
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

					//move = gui.legalMoves[from][to];
					//handleMove(move, false);
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

		console.log('Chessboard directive linked.', element);
	}
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template-chessboard.html',
		link: linkChessboard
		//scope: {}
	};
});
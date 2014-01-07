'use strict';

app.factory('ui', function(settings, rules) {
//	Define User Interface.
	var ui = {};
//	Property 				Description
//	----------------------------------------------------------------------------
//	position 				Currently displayed position object.
	var position;

	/*
	Object.defineProperty(ui, 'displayPieces', {
		value: function(position) {
			console.assert(position.fen.match(rules.validFen), 'Invalid position (FEN).', position.fen);
		//	Display pieces in given configuration.
		//	1.	For each piece in play append a piece div to the .chessboard div.
		//	2.	Adjust div position to match piece's position on the board.
		//	3.	Add .data('square') token to mark piece's current square.
		// 	<div 'chessboard'>
		//		<div class='piece white rook'></div>
		//		...
		//	</div>
			var pieceDiv, square, boardDiv = $('.chessboard'); // document.getElementById('chessboard');
			for (var piece in position.pieceLists.all) {
				square = position.pieceLists.all[piece].square;
				pieceDiv = "<div class='piece ";
				pieceDiv += (position.pieces[square].color) ? "black " : "white ";
				pieceDiv += position.pieces[square].name;
				pieceDiv += "'></div>";
				boardDiv.append(pieceDiv);

				//pieceDiv = '<div piece></div>';
				//pieceDiv = angular.element(pieceDiv);
				//pieceDiv = $compile(pieceDiv)($rootScope.$new());
				//console.log('Tricks done:', boardDiv, pieceDiv);
				//boardDiv.appendChild(pieceDiv);				

				pieceDiv = boardDiv.children('.piece').last();
				pieceDiv.position({
					'of': $('#' + square),
					'my': "left top",
					'at': "left top"
				});
				pieceDiv.data('square', +(square));
			}
			console.log('%cCreating pieces...', "color:DarkViolet;", boardDiv.children('.piece').length);
		}
	});
	*/

	console.time('Setting initial position');
	position = rules.position(settings.fen);
	position.setPieceLists();
	position.setPieceAttacks();
	position.setAttacked();
	position.setChecks();
	position.setPins();
	position.setMoves();
	ui.position = position;
	console.timeEnd('Setting initial position');
	console.log('Current Position', position);

	//setTimeout(function() {
	//	ui.displayPieces(position)
	//}, 2000);

	console.log('`ui` service ready.');
	return ui;
});
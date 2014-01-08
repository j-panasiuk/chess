'use strict';

app.controller('chessboardController', function($scope, settings, rules, game) {

	$scope.legalTargets = [];
	$scope.legalMoves = [];

	$scope.updateMovesHash = function(color) {
		console.time('Update legal moves hash');
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
	//	Helper function for UI. Matches all square sources and their possible targets.
	//	To save computation on future mouse drag/drop events.
	//	legalTargets[1] = [32, 34]			legalMoves[1][32] = Move{}
		var selectableSquares, 
			position = game.currentPosition, 
			legalTargets = [], 
			legalMoves = [];

	//	Allow to select all pieces matching given color.
		selectableSquares = position.pieceLists[color].map(function(piece) {
			return piece.square;
		});
	//	Create legal moves hash.
		for (var square in selectableSquares) {
			square = selectableSquares[square];
			legalTargets[square] = position.pieces[square].moves.map(function(move) {
				return move.to;
			});
			legalMoves[square] = {};
			for (var target in legalTargets[square]) {
				target = legalTargets[square][target];
				legalMoves[square][target] = _.find(position.pieces[square].moves, function(move) {
					return !!(move.to === target);
				});
			}
		}
		$scope.legalTargets = legalTargets;
		$scope.legalMoves = legalMoves;
		Object.freeze(legalTargets);
		Object.freeze(legalMoves);

		console.log('%cNumber of legal moves:', "color:DarkViolet", position.moves.length);
		console.timeEnd('Update legal moves hash');
	};

	$scope.selectMoveUser = function(color) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		console.log('User selects a move...', game.players[color]);
	//	Enable selecting pieces for user (drag & drop).
	//	Compute moves hash table for quicker access to moves.
	//	Before allowing move selection, assert data compability.
	//	Moves available for user ($scope.legalMoves) must match the set 
	//	of legal moves based on game logic (game.currentPosition.moves).
		$scope.updateMovesHash(color);
		$scope.validateMovesHash();
		$scope.enableSelect(color);
	};

	$scope.selectMoveAI = function(color) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		console.log('AI selects a move...', game.players[color]);
	//	Select the legal move with the highest value.
	//	Since AI choses moves based on game logic and not on legalMoves
	//	hash table, there is no need to check their compability.
		var move,
			delay = 200,
			position = game.currentPosition;

		setTimeout(function() {
			try {
				move = getBestMove(position);
			} catch (error) {
				console.log('Error in AI move generation.', move, error.message);
			//	Problems encountered in move generating script.
			//	Fallback to basic move selection method (based on move value).				
				move = position.moves.sort(function(x, y) { return y.value - x.value; })[0];
			} finally {
				console.debug('Finally...');
				$scope.handleMove(move);
			}
		}, delay);
	};

	$scope.handleMove = function(move) {
		console.assert(game.currentPosition.moves.indexOf(move) > -1, 'Illegal move selected.', move);
	//	A legal move has been selected by the active side.
	//	Depending on who selected the move:
	//	A. 	If move was played by the user, it has already appeared
	//		on the board. Update game logic to bring the game to
	//		new position. It may be necessary, though, to cleanup
	//		after captures (also enpassant) and castling afterwards.
	//	B. 	If move was chosen by AI, it has to be displayed from scratch.
	//		This means moving the selected piece first (to bring board
	//		to the same state as after a player-selected move), and then,
	//		after updating game logic, doing necessary cleanup.
	//	C. 	Any move from non-local source has to be fully displayed.
	//	Finally, determine game result after the move.
	//
		var result,
			fullDisplayRequired;
		console.log('%cSELECTED MOVE:', "color:DarkViolet;font-weight:bold", move.notation, '\n');

	//	Display direct move of a piece (if not moved by the player).
		fullDisplayRequired = !game.players[game.currentPosition.activeColor].isUser;
		if (fullDisplayRequired) {
			$scope.displayDirectMove(move);
		}

	//	Update game logic.
		console.time('Updating position');
		game.currentPosition.update(move);
		console.timeEnd('Updating position');		

	//	Cleanup after a non-standard move.
		if (move.requiresCleanup) {
			$scope.cleanupMove(move);
		}

	//	Wait for all animations to complete. Finish the turn.
		$('.piece').promise().done(function() {
			console.log('%cAnimations complete.', "color: red");
		//	Wait until all piece animations are done.
		//	Finish the turn.
		//
			$scope.validatePieceData();

			result = game.currentPosition.gameOver;
			if (result) {
			//	Game over!
				console.log('Game over:', result);
			} else {				
				//if (gui.debug.isOn) {
				//	console.time('Updating debugging artifacts');
				//	gui.purge();
				//	gui.debug.squareIds();
				//	gui.debug.attacked();
				//	gui.debug.pieceData();
				//	gui.debug.checks();
				//	gui.debug.pins();
				//	console.timeEnd('Updating debugging artifacts');
				//}
				$scope.nextTurn();
			}	
		});
	};

	$scope.validateMovesHash = function() {
		console.time('Data Validation');
		console.log('%cValidating data compability: Moves', "color:LimeGreen");
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare available moves:
	//	A.	currentPosition.moves 			(internal game logic)
	//	B.	legalMoves 						(user interface hash table)
		var data, 
			validMoves = true;

		data = _.flatten($scope.legalMoves);
		data = data.map(function(dict) { return _.toArray(dict); });
		data = _.flatten(data);
		for (var move in data) {
			move = data[move];
			if (game.currentPosition.moves.indexOf(move) === -1) {
				validMoves = false;
				break;
			}
		}

		console.assert(validMoves, 'Incompatible legal moves.', data, game.currentPosition.moves);		
		console.log('%cData successfully verified.', "color:LimeGreen");
		console.timeEnd('Data Validation');
	};

	$scope.validatePieceData = function() {
		console.time('Data Validation');
		console.log('%cValidating data compability: Pieces', "color:LimeGreen");
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare pieces on the board:
	//	A.	currentPosition.pieceLists 		(internal game logic)
	//	B. 	$('.piece') 					(user interface DOM elements)
		var validCount = true, 
			validSquares = true;

		validCount = ($('.piece').length === game.currentPosition.pieceLists.all.length);
		$('.piece').each(function() {
			var square = $(this).data('square');
			if (!game.currentPosition.pieces[square]) {
				validSquares = false;
				return false;
			}
		});

		console.assert(validCount, 'Incompatible pieces.', $('.piece').length, game.currentPosition.pieceLists.all.length);
		console.assert(validSquares, 'Incompatible occupied squares.');	
		console.log('%cData successfully verified.', "color:LimeGreen");
		console.timeEnd('Data Validation');
	};

	$scope.startGame = function() {
		$scope.displayPieces(game.currentPosition);
		$scope.enableDragDrop();
		//$scope.enableSelect(0);
		$scope.nextTurn();
		console.log('Starting game!');
	};

	$scope.nextTurn = function() {
		var activeColor = game.currentPosition.activeColor,
			activePlayer = game.players[activeColor];

		if (activePlayer.isUser) {
			$scope.selectMoveUser(activeColor);
		} else if (activePlayer.isAI) {
			$scope.selectMoveAI(activeColor);
		}
	};

	setTimeout(function init() {
		$scope.startGame();
	}, 500);

});
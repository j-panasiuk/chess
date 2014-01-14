'use strict';

app.controller('chessboardController', function($scope, $timeout, settings, rules, game, engine) {

	$scope.squares = rules.SQUARES;
	$scope.pieces = {
		'white': [],
		'black': []
	};

	$scope.legalTargets = [];
	$scope.legalMoves = {};
	
	$scope.squaresState = {};
	for (var square in rules.SQUARES) {
		square = rules.SQUARES[square];
		$scope.squaresState[square] = 0;
	}

	$scope.updateSquaresState = function() {
	//	`squaresState` hash tracks current status of each square on the board.
	//	This includes keeping information about checks and pins.
		var checkSquares, pinSquares, check, pin,
			checks = game.currentPosition.checks,
			pins = game.currentPosition.pinLists.all;

		if (!checks.length) {
			checkSquares = [];
		} else {
			checkSquares = checks.map(function(check) {
				return check.ray;
			});
			checkSquares = _.flatten(checkSquares);
		}

		if (!pins.length) {
			pinSquares = [];
		} else {
			pinSquares = pins.map(function(pin) {
				return pin.ray;
			});
			pinSquares = _.flatten(pinSquares);
		}

		for (var square in rules.SQUARES) {
			square = rules.SQUARES[square];
			check = _.contains(checkSquares, square) ? 1 : 0;
			pin = _.contains(pinSquares, square) ? 2 : 0;

			$scope.squaresState[square] = 0 | check | pin;
		}
	};

	$scope.updateMovesHash = function(color) {
		console.time('Update legal moves hash');
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
	//	Helper function for UI. Matches all square sources and their possible targets.
	//	To save computation on future mouse drag/drop events.
	//	legalTargets[1] = [32, 34]			legalMoves[1][32] = Move{}
		var selectableSquares, 
			position = game.currentPosition, 
			legalTargets = [],
			legalMoves = {};

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

		console.log('%cLegal move count...', LOG.action, position.moves.length);
		console.timeEnd('Update legal moves hash');
	};

	$scope.selectMoveUser = function(color) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		console.log('%cUser selects a move...', LOG.action, rules.COLOR_NAME[color]);
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
		console.log('%cAI selects a move...', LOG.action, rules.COLOR_NAME[color]);
	//	Select the legal move with the highest value.
	//	Since AI choses moves based on game logic and not on legalMoves
	//	hash table, there is no need to check their compatibility.
		var move,
			delay = settings.delayAI || 100,
			position = game.currentPosition;

		engine.tree.plant(position);
		console.log('%ctree:', LOG.state, engine.tree);

		$timeout(function() {
			try {
				move = engine.getMove(position);
			} catch (error) {
				console.log('%cCaught error in AI move generation.', LOG.warn, error.message);
			//	Problems encountered in move generating script.
			//	Fallback to basic move selection method (based on move value).
				move = _.sample(position.moves);				
				//move = position.moves.sort(function(x, y) {	
				//	return y.value - x.value; 
				//})[0];
			} finally {
				console.debug('%cAI selected move.', LOG.action, move.san);
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
		var fullDisplayRequired;
		console.log('%cMove selected.', LOG.action, move.san);

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
			console.log('%cAnimations complete.', LOG.promise);
			$scope.endTurn();
		});
	};

	$scope.endTurn = function() {
	//	Validate piece positions.
	//	Update debugging interace, if necessary.
	//	Check game result.
		var result;

		$scope.updateSquaresState();
		$scope.$digest();
		$scope.validatePieceData();		

		result = game.currentPosition.gameOver;
		if (result) {

			$scope.endGame(result);

		} else {

			$scope.nextTurn(true);

		}
	};

	$scope.validateMovesHash = function() {
		console.time('Data Validation');
		console.log('%cValidating data compability: Moves', LOG.valid);
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare available moves:
	//	A.	currentPosition.moves 			(internal game logic)
	//	B.	legalMoves 						(user interface hash table)
		var data, 
			validMoves = true;

		data = _.toArray($scope.legalMoves).map(function(targets) {
			return _.toArray(targets);
		});
		data = _.flatten(data);
		for (var move in data) {
			move = data[move];
			if (game.currentPosition.moves.indexOf(move) === -1) {
				validMoves = false;
				break;
			}
		}

		console.assert(validMoves, 'Incompatible legal moves.', validMoves, data, game.currentPosition.moves);
		console.log('%cData successfully verified.', LOG.valid);
		console.timeEnd('Data Validation');
	};

	$scope.validatePieceData = function() {
		console.time('Data Validation');
		console.log('%cValidating data compability: Pieces', LOG.valid);
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare pieces on the board:
	//	A.	currentPosition.pieceLists 		(internal game logic)
	//	B. 	$('.piece') 					(user interface DOM elements)
		var validCount = true, 
			validSquares = true;


		if ($('.piece.white').length !== $scope.pieces.white.length) {
			validCount = false;
		}
		if ($('.piece.black').length !== $scope.pieces.black.length) {
			validCount = false;
		}

		$('.piece').each(function() {
			var square = +$(this).attr('at');
			if (!game.currentPosition.pieces[square]) {
				console.debug('PIECE PLACEMENT ERROR', this, square, game.currentPosition.pieces);
				validSquares = false;
				return false;
			}
		});

		console.assert(validCount, 'Incompatible pieces.', $('.piece').length, $scope.pieces.white.length, $scope.pieces.black.length);
		console.assert(validSquares, 'Incompatible occupied squares.');	
		console.log('%cData successfully verified.', LOG.valid);
		console.timeEnd('Data Validation');
	};

	$scope.startGame = function(restart) {
	//	Begin tracking pieces, based on current game model.
		$scope.pieces = {
			'white': game.currentPosition.pieceLists[0],
			'black': game.currentPosition.pieceLists[1]
		};
	//	In case of restarting a game, $digest of chessboard scope is needed
	//	to let HTML chessboard template catch up with refreshed model.	
		if (restart) {	
			$scope.$digest();
		}
		$scope.enableDragDrop();
		$scope.nextTurn(false);
		console.log('%cGameflow started. Restart:', LOG.action, restart);
	};

	$scope.nextTurn = function(switchActive) {
		console.assert((switchActive === true) || (switchActive === false), 'Attribute `switchActive` missing.');
	//	Select next player to choose a move.
	//	If the game is in progress (switchActive == true), always select opposite player.
	//	On game's first move don't switch active player (switchActive == false). 
		if (switchActive) {
			console.log('%c\nNEXT TURN\n', LOG.action);
			game.switchActive();
		}
		if (game.activePlayer.isUser) {
			$scope.selectMoveUser(game.activeColor);
		} else if (game.activePlayer.isAI) {
			$scope.selectMoveAI(game.activeColor);
		}
	};

	$scope.endGame = function(result) {
		console.log('%c\nGAME OVER\n', LOG.action, result);
		$scope.$emit('gameOver', result);
	}

	$scope.$on('startGame', function(event, restart) {
		$scope.startGame(restart || false);
	});

});
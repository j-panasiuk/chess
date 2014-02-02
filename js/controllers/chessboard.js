'use strict';

app.controller('chessboardController', function($scope, $timeout, $q, settings, rules, game, engine) {

	$scope.settings = settings;
	$scope.rules = rules;
	$scope.game = game;
	$scope.engine = engine;

	$scope.squares = rules.SQUARES;
	$scope.squaresState = {};

	$scope.selectablePieces = [];
	$scope.selectedPiece = null;
	$scope.selectableSquares = [];
	$scope.availableMoves = [];

	$scope.isSelectablePiece = function(piece) {
		return _.contains($scope.selectablePieces, piece);
	};

	$scope.isSelectableSquare = function(square) {
		return _.contains($scope.selectableSquares, square);
	};

	$scope.isSelected = function(piece) {
		return $scope.selectedPiece === piece;
	};

	$scope.handlePieceSelect = function(piece) {
		console.log('%cSelected piece...', LOG.ui, piece.name);
		$scope.selectedPiece = piece;
		$scope.availableMoves = piece.moves || [];
		$scope.selectableSquares = $scope.availableMoves.map(function(move) {
			return move.to;
		});		
		console.log('%cAvailable moves', LOG.ui, $scope.availableMoves.length);
	};

	$scope.handleSquareSelect = function(square) {
		console.log('%cSelected square...', LOG.ui, square);
		var selectedMove;
		if (_.contains($scope.selectableSquares, square)) {
			selectedMove = _.find($scope.availableMoves, function(move) {
				return move.to === square;
			});
			$scope.handleMove(selectedMove);
		}
	};

	$scope.disableSelect = function() {
		$scope.disablePieceSelect();
		$scope.disableSquareSelect();
		$scope.selectedPiece = null;
	};

	$scope.reset = function() {
	//	Reset scope variables to initial state.
	//	Start tracking pieces on the chessboard based on current model.
		//$scope.pieces = game.currentPosition.pieceLists.all;

	//	Reset all square states.
		//for (var square in rules.SQUARES) {
		//	square = rules.SQUARES[square];
		//	$scope.squaresState[square] = 0;
		//}
	};

	$scope.debug = function(show) {
		console.assert((typeof(show) === 'boolean') || (show === undefined), 'Invalid debug value.', show);
	//	Set debug interface visibilty.
	//	debug(true/false): show/hide debug interface.
	//	debug(undefined): toggle debug interface.
		if (show === true) {
			settings.debugMode = true;
		} else if (show === false) {
			settings.debugMode = false;
		} else {
			settings.debugMode = !settings.debugMode;
		}
		console.log('%cdebug:', LOG.state, settings.debugMode);
	};

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

	$scope.selectMoveUser = function(color) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		console.log('%cUser selects a move...', LOG.action, rules.COLOR_NAME[color]);
	//	Enable selecting pieces for user (drag & drop).
	//	Compute moves hash table for quicker access to moves.
	//	Before allowing move selection, assert data compability.
	//	Moves available for user ($scope.legalMoves) must match the set 
	//	of legal moves based on game logic (game.currentPosition.moves).
	//			
		$scope.enablePieceSelect(color);
		$scope.validateMoves();
	};

	$scope.selectMoveAI = function(color) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color value.', color);
		console.log('%cAI selects a move...', LOG.action, rules.COLOR_NAME[color]);
	//	Select the legal move with the highest value.
	//	Since AI choses moves based on game logic and not on legalMoves
	//	hash table, there is no need to check their compatibility.
		var move,
			delay = settings.delayAI || 200,
			position = game.currentPosition;

		console.log('%ctree:', LOG.state, engine.tree);

		$timeout(function() {
			var promise = engine.tree.getMove(position);

			promise.then(function(san) {
				console.log('%cMove promise resolved:', LOG.promise, san);
				move = _.find(position.moves, function(move) {
					return move.san === san;
				}) || _.sample(position.moves);

				$scope.handleMove(move);
			});

		}, delay);
	};

	$scope.handleMove = function(move) {
		console.assert(game.currentPosition.moves.indexOf(move) > -1, 'Illegal move selected.', move);
		console.log('%cMove selected.', LOG.action, move);
	//	A legal move has been selected by the active side.
	//		
		$scope.disableSelect();

	//	Update game logic.
		game.currentPosition.update(move);
		game.history.update(move);		

		$timeout(function() {
			$scope.validatePieceData();
			$scope.endTurn();
		}, settings.animationTime + 100);

		/*
		var animations = $q.defer();
		(function collectAsync() {
			return $q.all([
				$timeout(function() { return 1; }, 250),
				$timeout(function() { return 2; }, 250),
				$timeout(function() { return 3; }, 250)
			])
			.then(function(results) {
				animations.resolve();
			});
		}());
		animations.promise.then(function() {
			console.log('Animations complete...', animations);
			$scope.validatePieceData();
			$scope.endTurn();
		});
		*/
	};

	$scope.endTurn = function() {
	//	Validate piece positions.
	//	Update debugging interace, if necessary.
	//	Check game result.
		var result;

		$scope.updateSquaresState();
		//$scope.$digest();		

		result = game.currentPosition.result;
		if (result) {

			$scope.endGame(result);

		} else {

			$scope.nextTurn(true);

		}
	};

	$scope.validateMoves = function() {
		console.log('%cValidating data compability: Moves', LOG.valid);
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare available moves:
	//	A.	currentPosition.moves 			(game model)
	//	B.	scope.availableMoves 			(user interface moves)
		var validMoves,
			legalMoves = game.currentPosition.moves,
			playableMoves = _.flatten($scope.selectablePieces.map(function(piece) { 
				return piece.moves; 
			}));

		validMoves = (playableMoves.length === legalMoves.length) && legalMoves.every(function(move) {
			return _.contains(playableMoves, move);
		});

		console.assert(validMoves, 'Incompatible legal moves.', legalMoves, playableMoves);
		if (validMoves) {
			console.log('%cData successfully verified.', LOG.valid);
		}
	};

	$scope.validatePieceData = function() {
		console.log('%cValidating data compability: Pieces', LOG.valid);
	//	Check if data across all representation types is compatible.
	//	Position displayed on the user interface cannot differ from
	//	internal position representation. Compare pieces on the board:
	//	A.	currentPosition.pieceLists 		(internal game logic)
	//	B. 	$('.piece') 					(user interface DOM elements)
		var validCount = true, 
			validSquares = true;

		//if (angular.element('.piece').length !== $scope.pieces.length) {
		//	console.log('%cPiece count does not match.', LOG.warn, angular.element('.piece').length, $scope.pieces.length);
		//	validCount = false;
		//}

		angular.element('.piece').each(function() {
			var square = +angular.element(this).attr('at');
			if (!game.currentPosition.pieces[square]) {
				console.log('%cPiece placement does not match.', LOG.warn, square);
				validSquares = false;
				return false;
			}
		});

		console.assert(validCount, 'Incompatible piece count.');
		console.assert(validSquares, 'Incompatible occupied squares.');
		if (validCount && validSquares) {
			console.log('%cData successfully verified.', LOG.valid);
		}		
	};

	$scope.startGame = function(restart) {
	//	Reset scope variables to initial values.
		$scope.reset();

	//	In case of restarting a game, $digest of chessboard scope is needed
	//	to let HTML chessboard template catch up with refreshed model.	
		if (restart) {			
			$scope.$digest();
			if (settings.switchColorOnRestart) {
				console.debug('Reversing colors...', settings.isReversed);
				$scope.reverse(settings.isReversed);
			}
		}

	//	Wait for initial animations to finish.
		$timeout(function() {
			$scope.nextTurn(false);
			console.log('%cGameflow started. Restart:', LOG.action, restart);
		}, 400);
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
		game.result = result;
		$scope.$emit('gameOver', result);
	};

	$scope.restart = function() {
		console.log($scope.game.activePlayer);
		$scope.$emit('restart');
	};

	$scope.$on('startGame', function(event, restart) {
		$scope.startGame(restart || false);		
	});

});
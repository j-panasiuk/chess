'use strict';

app.factory('game', function(settings, rules) {
	var game = {};
//	Property 				Description
//	----------------------------------------------------------------------------
//	players 				Array[2] of player objects. [<white>, <black>]
//	currentPosition 		position object representing current game state.
//	history					Object containing two lists: fen positions and moves.
//
//	player 					Factory function of player objects.
//	start 					Function. Begins the game.
//	nextTurn 				Function.

//	Declare local variables.
	var players, currentPosition,
		_player, _user, _ai, _history; // Prototypes.

	Object.defineProperties(game, {
		'players': 			{ writable: true, enumerable: true, configurable: true },
		'currentPosition': 	{ writable: true, enumerable: true, configurable: true },
		'history': 			{ writable: true, enumerable: true, configurable: true }			
	});

//	* Player Objects
//	Property 				Description
//	----------------------------------------------------------------------------
//	color 					Color code				
//	control 		 		Control flag. Who controls the pieces? 			
//							'none' == 0
//							'user' == 1
// 							'ai' == 2
//	isLocal					(getter) boolean. False for non-local opponent (over network)
//	isUser 					(getter) boolean. True for human player.
// 	isAI					(getter) boolean. True for computer player.
//	*difficulty				(*for AI only) default == 0.
//
//	selectMove				Function. For human player allows to select next move.
//							For computer player uses algorithm to select optimal move.

	_player = {};
	Object.defineProperties(_player, {
		'color': 			{ writable: true, configurable: true },
		'isLocal': 			{ get: function() { return !!(this.control); } },
		'isUser': 			{ get: function() { return !!(this.control & settings.CONTROL_FLAGS.user); } },
		'isAI': 			{ get: function() { return !!(this.control & settings.CONTROL_FLAGS.ai); } }	
	});

	_user = Object.create(_player);
	Object.defineProperties(_user, {
		'control': 			{ value: settings.CONTROL_FLAGS.user },
		'selectMove': 		{ writable: true, configurable: true }
	});

	_ai = Object.create(_player);
	Object.defineProperties(_ai, {
		'control': 			{ value: settings.CONTROL_FLAGS.ai },
		'difficulty': 		{ value: settings.difficulty },
		'selectMove': 		{ writable: true, configurable: true }
	});	

	function player(color, control) {
		console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color.', color);
		console.assert(_.contains(settings.CONTROL_FLAGS, +control), 'Invalid flag.', control);
	//	Player factory function.
		var player;
		function Player() {};
		switch (+control) {
			case 1: 		Player.prototype = _user; break;
			case 2: 		Player.prototype = _ai; break;
			default: 		Player.prototype = _player;
		}

		player = new Player();
		player.color = color;

		console.log('Creating new player:', player);
		return player;
	}
	game.player = player;

	//console.debug('Control flags (w, b):', settings.controlWhite, settings.controlBlack);
//	Create player objects for white and black.
//	Freeze to disable changing player settings during the game.
	players = [];
	players.push(player(0, settings.controlWhite));
	players.push(player(1, settings.controlBlack));
	Object.freeze(players);
	game.players = players;
	console.log('Players created', players);

//	Creating starting position.
//	(Accessible through: game.currentPosition)
	console.time('Setting position');
	currentPosition = rules.position(settings.fen);
	currentPosition.setPieceLists();
	currentPosition.setPieceAttacks();
	currentPosition.setAttacked();
	currentPosition.setChecks();
	currentPosition.setPins();
	currentPosition.setMoves();
	game.currentPosition = currentPosition;
	console.timeEnd('Setting position');

//	Creating game history.
//	(Accessible through: game.history)
	_history = {};
	Object.defineProperties(_history, {
		'fenList': 		{ value: [currentPosition.fen], writable: true, enumerable: true, configurable: true },
		'moveList': 	{ value: [], writable: true, enumerable: true, configurable: true },
		'pgn': 			{ get: function() { return 'PGN string.'; } }
	});
	Object.preventExtensions(_history);
	game.history = _history;

//	Starting the game.
	Object.defineProperty(game, 'start', {
		value: function() {
		//	Start playing!
		//	Define rules for selecting moves (depending on player control flag).
		//	Prevent further extensions for game objects.
			for (var p in this.players) {
				p = this.players[p];
				if (p.isLocal) {
					p.selectMove = (p.isUser) ? selectMoveUser : selectMoveAI;
					Object.freeze(p);
				}
			}
		}
	});

//	Proceeding to next turn.
	Object.defineProperty(game, 'nextTurn', {
		value: function nextTurn() { 
			console.debug('NEXT TURN');
		//	The board is ready to continue playing.
		//	Allow active side to select new move.			
			this.players[this.currentPosition.activeColor].selectMove();
		}
	});	
	Object.preventExtensions(game);

	function selectMoveUser() {
		console.log('User selects a move...', game.players[this.color]);
	//	Enable selecting pieces (drag & drop).
	//	Compute moves hash table for quicker access to moves.
	//	Before allowing move selection, assert data compability.
	//	Moves available for user (gui.legalMoves) must match the set 
	//	of legal moves based on game logic (game.currentPosition.moves).
		var move, 
			color = this.color;
		//gui.updateMovesHash(color);
		//gui.validateMovesHash();
		//gui.enableSelect(color);
	}

	function selectMoveAI() {
		console.log('AI selects a move...', game.players[this.color]);
	//	Select the legal move with the highest value.
	//	Since AI choses moves based on game logic and not on legalMoves
	//	hash table, there is no need to check their compability.
		var move, 
			fullDisplay = true, 
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
				//gui.handleMove(move, fullDisplay);
			}
		}, delay);
	}


	console.log('`game` service ready.');
	return game;
});
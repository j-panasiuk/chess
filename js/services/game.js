'use strict';

app.factory('game', function(settings, rules) {
	var game = {};
//	Property 				Description
//	----------------------------------------------------------------------------
//	players 				Array[2] of player objects. [<white>, <black>]
//	currentPosition 		position object representing current game state.
//	activeColor 			(Quick Access) Active color value: 0 | 1
//	activePlayer 			(Quick Access) Pointer to active player object.
//	history 				*TBI
//
//	player 					Factory function of player objects.
//	switchActive 			Function. Changes active side to the opponent.

//	Declare local variables (for factories).
	var _player, _user, _ai; // Prototypes.

	Object.defineProperties(game, {
		'players': 			{ writable: true, enumerable: true, configurable: true },
		'currentPosition': 	{ writable: true, enumerable: true, configurable: true },
		'activeColor': 		{ writable: true, enumerable: true, configurable: true },
		'activePlayer': 	{ writable: true, enumerable: true, configurable: true }	
		//'history': 		{ writable: true, enumerable: true, configurable: true },		
	});

	Object.defineProperty(game, 'switchActive', {
		value: function() {
			this.activeColor = rules.opposite(this.activeColor);
			this.activePlayer = this.players[this.activeColor];
		}
	});

	Object.defineProperty(game, 'initialize', {
		value: function(players, fen) {
			console.assert((players === undefined) || (players.length === 2), 'Invalid players array.');
			console.assert((fen === undefined) || fen.match(rules.validFen), 'Invalid FEN.');
		//	Initialize game logic, based on supplied arguments and global settings.
		//	Both arguments are optional; if not provided, fallback to default values.
			var currentPosition;

		//	Define players.
			if (!players) {
				players = [];
				players.push(player(0, settings.controlWhite));
				players.push(player(1, settings.controlBlack));				
			}
			Object.freeze(players);
			this.players = players;

		//	Create starting position.
		//	Update all properties.
			var fen = fen || settings.fen;
			currentPosition = rules.position(fen);
			currentPosition.setPieceLists();
			currentPosition.setPieceAttacks();
			currentPosition.setAttacked();
			currentPosition.setChecks();
			currentPosition.setPins();
			currentPosition.setMoves();
			this.currentPosition = currentPosition;

		//	Creating quick access properties.
			this.activeColor = this.currentPosition.activeColor;
			this.activePlayer = this.players[this.activeColor];
		}
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

		console.log('%cCreating new player...', LOG.action, player);
		return player;
	}
	game.player = player;

//	* GAME HISTORY
//	Property 				Description
//	----------------------------------------------------------------------------
/*
	_history = {};
	Object.defineProperties(_history, {
		'fenList': 		{ value: [currentPosition.fen], writable: true, enumerable: true, configurable: true },
		'moveList': 	{ value: [], writable: true, enumerable: true, configurable: true },
		'pgn': 			{ get: function() { return 'PGN string.'; } }
	});
	Object.preventExtensions(_history);
	game.history = _history;
*/

//	Initialize default game model.
	game.initialize();

	return game;
});
'use strict';

app.factory('game', function(settings, rules) {
	var game = {};
//	Property 				Description
//	----------------------------------------------------------------------------
//	players 				Array[2] of player objects. [<white>, <black>]
//	currentPosition 		position object representing current game state.
//	activeColor 			(Quick Access) Active color value: 0 | 1
//	activePlayer 			(Quick Access) Pointer to active player object.
//	history 				object storing serialized moves and positions.
//	result 					(Flag) game result.
//
//	player 					Factory function of player objects.
//	switchActive 			Function. Changes active side to the opponent.

//	Declare local variables (for factories).
	var _player, _user, _ai, _history; // Prototypes.

	Object.defineProperties(game, {
		'players': 			{ writable: true, enumerable: true, configurable: true },
		'currentPosition': 	{ writable: true, enumerable: true, configurable: true },
		'activeColor': 		{ writable: true, enumerable: true, configurable: true },
		'activePlayer': 	{ writable: true, enumerable: true, configurable: true },	
		'history': 			{ writable: true, enumerable: true, configurable: true },
		'result': 			{ writable: true, enumerable: true, configurable: true }		
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
				players.push(createPlayer(0, settings.controlWhite));
				players.push(createPlayer(1, settings.controlBlack));				
			}
			Object.freeze(players);
			this.players = players;

		//	Create starting position.
		//	Update all properties.
			var fen = fen || settings.fen;
			currentPosition = rules.createPosition(fen);
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
			this.result = 0;

		//	Create game history.
			this.history = createHistory();
			console.log('%cCreating game history...', LOG.action, this.history);
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

	function createPlayer(color, control) {
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
	//game.createPlayer = createPlayer;

//	* GAME HISTORY
//	Property 				Description
//	----------------------------------------------------------------------------

	_history = {};
	Object.defineProperties(_history, {
		'fenList': 		{ writable: true, enumerable: true, configurable: true },
		'sanList': 		{ writable: true, enumerable: true, configurable: true },
		'pgn': { 
			get: function() {
			//	Return PGN (Portable Game Notation) string.
				var pgn = '';
			//	[Event "F/S Return Match"]
			//	[Site "Belgrade"]
			//	[Date "1992.11.04"]
			//	[Round "29"]
			//	[White "Fischer, Robert J."]
			//	[Black "Spassky, Boris V."]
			//	[Result "1/2-1/2"]
			//
			//	1. e4 e5 2. Nf3 Nc6 3. Bb5 ... 43. Re6 1/2-1/2

			//	Join array of san notations into full pgn string.
				for (var i = 0; i < this.sanList.length; i++) {
					pgn += (i % 2) ? '' : Math.ceil((i + 1) / 2) + '. ';
					pgn += this.sanList[i] + ' ';
				}

			//	Append game result, if finished.
				return pgn;
			} 
		},
		'update': {
			value: function(move) {
			//	Update history after a move has been played.
				this.sanList.push(move.san);
				this.fenList.push(game.currentPosition.fen);
				console.log('%cUpdating game history...', LOG.action, this);
			}
		}
	});

	function createHistory(pgn) {
		console.assert(pgn === undefined, 'Invalid PGN history.', pgn);
	//	History factory function.
		var history_;
		function History() {};
		History.prototype = _history;
		history_ = new History();

	//	Set history to default (starting position).
		history_.fenList = [settings.fen];
		history_.sanList = [];

		return history_;
	}

//	Initialize default game model.
	game.initialize();

	GAME = game;
	P = game.currentPosition;

	return game;
});
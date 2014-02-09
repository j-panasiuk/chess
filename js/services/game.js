'use strict';var G;

app.factory('game', function(settings, rules) {
    var game = {};
//  Property           		Description
//  ----------------------------------------------------------------------------
//  players                 Array[2] of player objects. [<white>, <black>]
//  currentPosition         position object representing current game state.
//  activeColor             (Quick Access) Active color value: 0 | 1
//  activePlayer          	(Quick Access) Pointer to active player object.
//  pieces                  (Quick Access) currentPosition.pieceList object.
//  history                 object storing serialized moves and positions.
//  started                 (Quick Access) boolean
//  result               	(Flag) game result.
//  chessboardState         object storing additional information about each square on
//                          the chessboard (useful for UI display).
//
//  player                	Factory function of player objects.
//  switchActive         	Function. Changes active side to the opponent.

//  Declare local variables (for factories).
    var _player, _user, _ai, _history, _chessboardState; // Prototypes.

    Object.defineProperties(game, {
        'players':          	{ writable: true, enumerable: true, configurable: true },
        'currentPosition':   	{ writable: true, enumerable: true, configurable: true },
        'activeColor':       	{ writable: true, enumerable: true, configurable: true },
        'activePlayer': 		{ writable: true, enumerable: true, configurable: true },
        'pieces':         		{ writable: true, enumerable: true, configurable: true },    
        'history':          	{ writable: true, enumerable: true, configurable: true },
        'result':           	{ writable: true, enumerable: true, configurable: true },
        'chessboardState':   	{ writable: true, enumerable: true, configurable: true },        
    });

    Object.defineProperty(game, 'started', {
        get: function() {
            return !!this.history.move;
        }
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
        //  Initialize game logic, based on supplied arguments and global settings.
        //  Both arguments are optional; if not provided, fallback to default values.
            var chessboardState;

        //  Define players.
            if (!players) {
                players = [];
                players.push(createPlayer(0, settings.controlWhite));
                players.push(createPlayer(1, settings.controlBlack));                
            }
            Object.freeze(players);
            this.players = players;

        //  Create starting position.
        //  Update all properties.
            this.currentPosition = rules.createPosition(fen || settings.fen);

        //  Create quick access properties.
            this.activeColor = this.currentPosition.activeColor;
            this.activePlayer = this.players[this.activeColor];
            this.pieces = this.currentPosition.pieceList;

            this.result = 0;

        //	Create chessboard state object.
            this.chessboardState = createChessboardState();

        //  Create game history.
            this.history = createHistory();
            console.log('%cCreating game history...', LOG.action, this.history);
        }
    });

//  * Player Objects
//  Property            	Description
//  ----------------------------------------------------------------------------
//  color                	Color code                
//  control              	Control flag. Who controls the pieces?             
//                          'none' == 0
//                          'user' == 1
//                        	'ai' == 2
//  isLocal              	(getter) boolean. False for non-local opponent (over network)
//  isUser             		(getter) boolean. True for human player.
// 	isAI                    (getter) boolean. True for computer player.
//  *difficulty           	(*for AI only) default == 0.
//
//  selectMove           	Function. For human player allows to select next move.
//                          For computer player uses algorithm to select optimal move.

    _player = {};
    Object.defineProperties(_player, {
        'color':        	{ writable: true, configurable: true },
        'isLocal':      	{ get: function() { return !!(this.control); } },
        'isUser':         	{ get: function() { return !!(this.control & settings.CONTROL_FLAGS.user); } },
        'isAI':             { get: function() { return !!(this.control & settings.CONTROL_FLAGS.ai); } }    
    });

    _user = Object.create(_player);
    Object.defineProperties(_user, {
        'control':       	{ value: settings.CONTROL_FLAGS.user },
        'selectMove':    	{ writable: true, configurable: true }
    });

    _ai = Object.create(_player);
    Object.defineProperties(_ai, {
        'control':        	{ value: settings.CONTROL_FLAGS.ai },
        'difficulty':     	{ value: settings.difficulty },
        'selectMove':      	{ writable: true, configurable: true }
    });    

    function createPlayer(color, control) {
        console.assert(rules.COLORS.indexOf(color) > -1, 'Invalid color.', color);
        console.assert(_.contains(settings.CONTROL_FLAGS, +control), 'Invalid flag.', control);
    //  Player factory function.
        var player;
        function Player() {};
        switch (+control) {
            case 1:         Player.prototype = _user; break;
            case 2:         Player.prototype = _ai; break;
            default:       	Player.prototype = _player;
        }

        player = new Player();
        player.color = color;

        console.log('%cCreating new player...', LOG.action, player);
        return player;
    }
    //game.createPlayer = createPlayer;

//  * GAME HISTORY
//  Property                 Description
//  ----------------------------------------------------------------------------

    _history = {};
    Object.defineProperties(_history, {
        'fenList':     		{ writable: true, enumerable: true, configurable: true },
        'sanList':       	{ writable: true, enumerable: true, configurable: true },
        'fullMoveList': 	{ writable: true, configurable: true },
        'pgn': { 
            get: function() {
            //  Return PGN (Portable Game Notation) string.
                var pgn = '';
            //  [Event "F/S Return Match"]
            //  [Site "Belgrade"]
            //  [Date "1992.11.04"]
            //  [Round "29"]
            //  [White "Fischer, Robert J."]
            //  [Black "Spassky, Boris V."]
            //  [Result "1/2-1/2"]
            //
            //  1. e4 e5 2. Nf3 Nc6 3. Bb5 ... 43. Re6 1/2-1/2

            //  Join array of san notations into full pgn string.
                for (var i = 0; i < this.sanList.length; i++) {
                    pgn += (i % 2) ? '' : Math.ceil((i + 1) / 2) + '. ';
                    pgn += this.sanList[i] + ' ';
                }

            //  Append game result, if finished.
                return pgn;
            } 
        },
        'move': {
            get: function() {
            //  Return last move's fullmove notation.
            //  For white: 1. Nf3
            //  For black: 1. ... d5
                var fullmove = _.last(this.fullMoveList);
                if (!fullmove) {
                    return null;
                }
                return fullmove.black ? fullmove.black : fullmove.white;
            //    var notation,
            //        fullmove = _.last(this.fullMoveList);
            //
            //    if (!fullmove) {
            //        return null;
            //    }
            //    notation = fullmove.index + '. ';
            //    notation += fullmove.black ? '... ' + fullmove.black.san : fullmove.white.san;
            //    return notation;
            },
            set: function(move) {
            //  Update history object after a move has been played.
                var position = game.currentPosition;

                this.sanList.push(move.san);
                this.fenList.push(position.fen);
                if (!move.color) {
                    this.fullMoveList.push({ 
                        index: position.fullMoveCount,
                        white: move
                    });
                } else {
                    _.last(this.fullMoveList).black = move;
                }
            //  Append check/checkmate sign to move notation if necessary.
                move.updateSufix(position);
            }
        }
    });

    function createHistory(pgn) {
        console.assert(pgn === undefined, 'Invalid PGN history.', pgn);
    //  History factory function.
        var history_;
        function History() {};
        History.prototype = _history;
        history_ = new History();

    //  Set history to default (starting position).
        history_.fenList = [settings.fen];
        history_.sanList = [];
        history_.fullMoveList = [];

        return history_;
    }

    _chessboardState = {};
    Object.defineProperty(_chessboardState, 'update', {
        value: function(position) {
            var squares, // Array of squares to modify.
                lastMove,
                self = this;

        //  Reset old values.
            rules.SQUARES.forEach(function(square) {
                self[square].check = false;
                self[square].pin = false;
                self[square].lastMove = false;
            });
        //  Update checks.
            if (_.size(position.checks)) {
                squares = _.flatten(position.checks.map(function(check) { return check.ray; }));
                squares.forEach(function(square) {
                    self[square].check = true;
                });
            }
        //  Update pins.
            if (_.size(position.pinList.all)) {
                squares = _.flatten(position.pinList.all.map(function(pin) { return pin.ray; }));
                squares.forEach(function(square) {
                    self[square].pin = true;
                });
            }
        //  Update last move.
            lastMove = game.history.move;
            if (lastMove) {
                console.debug('Updating lastMove', lastMove);
                self[lastMove.from].lastMove = true;
                self[lastMove.to].lastMove = true;
            }            
        }
    });

    function createChessboardState() {
        var state;
        function ChessboardState() {};
        ChessboardState.prototype = _chessboardState;
        state = new ChessboardState();

        rules.SQUARES.forEach(function(square) {
            state[square] = {
                'check': false,
                'pin': false,
                'lastMove': false
            };
        });

        return state;
    }

//  Initialize default game model.
    game.initialize();

    G = game;
    return game;
});
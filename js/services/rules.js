'use strict';

//	Define standard chess rules.
app.factory('rules', function(settings) {
	console.log('%cDefining basic data...', LOG.action);
//	Chess rules are precomputed and stored in `rules` object, which is a set of 
//	(frozen) flags, arrays and hashtables. Anything regarding chess rules, move
//	generation & validity etc, which may be of use to other modules is kept here.
//
//	`rules` object acts as a service, providing chess rules to other modules.
//	Any chess rule can be accessed through `rules` object properties/methods.
//	For full list of available data, see the index below.
//
	var rules = {};
//	Property 				Description
//	----------------------------------------------------------------------------
//	COLORS 					List of color codes [0, 1]
//	COLOR_NAME 				Hash of color names {0:'white', 1:'black'}
//	SQUARES 				List of square codes [0, 1... 119]
//	SQUARE_NAME				Hash of square names {0:'a1'... 119:'h8'}
//	PIECE_NAME 				Hash of piece names {17:'pawn', 18:'knight'... 31:'queen'}
//	CASTLE_ROOKS 			Hash of rook move coordinates for castling.		
//	ENPASSANT_TARGET 		Hash of captured pawn's coordinate (captured enpassant).
//	validFen 				RegEx for FEN string validation.
//
//	position(fen)			Factory function of position objects.
//	check
//	pin
// 	piece
//	move
//
//	opposite 				Returns opposite color code.

//	Declare local variables.
	var COLORS, COLOR_NAME, COLOR_MASK, SQUARES, FILE_NAMES, RANK_NAMES, SQUARE_NAME, RANKS, FILES,
		PIECES, PIECE_TYPES, PIECE_NAME, FEN_TO_CODE, CODE_TO_FEN, PIECE_TYPE_NOTATION, // Pieces.
		ATTACK_VECTORS, PASSIVE_VECTORS, ATTACK_RAYS, PASSIVE_RAYS, ATTACK_FIELDSET, // Piece attacks & movement.
		QUEENING_RANK, QUEENING_RANK_INDEX, SEVENTH_RANK, SEVENTH_RANK_INDEX, // Specific ranks.
		CASTLE_ROOKS, CASTLE_KING_TO, ENPASSANT_TARGET, // Special moves & square-specific stuff.
		MOVE_SPECIAL_MASK, MOVE_SPECIAL, // Move special values.
		validFen, // Regular expression.
		_check, _pin, _piece, _move, // Object prototypes.
		_pawn, _knight, _bishop, _rook, _queen, _king, // Piece prototypes.
		WHITE = 0, BLACK = 1, // Color codes.
		PAWN = 1, KNIGHT = 2, KING = 3, BISHOP = 5, ROOK = 6, QUEEN = 7, // Piece type codes.
		W = 16, B = 24, RANGED_FLAG = 4; // Piece masks.

	COLORS = [WHITE, BLACK];
	rules.COLORS = COLORS;

	rules.COLOR_NAME = {};
	rules.COLOR_NAME[0] = 'white';
	rules.COLOR_NAME[1] = 'black';

	COLOR_MASK = {};
	COLOR_MASK[0] = W;
	COLOR_MASK[1] = B;

//	SQUARES :: Array[64]
//	Stores all square values, starting from 0 = A1 up to 119 = H8.
//	[0, 1, 2... 7, 16, 17... 118, 119]
	SQUARES = [];
	rules.SQUARES = SQUARES;
	for (var i = 0; i < 128; i++) {
		if (i.onBoard) {
			SQUARES.push(i);
		}	
	}

//	FILE_NAMES, RANK_NAMES :: Array[8]
	FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];

//	RANKS :: Array[8 Array[8]]
//	Stores squares arranged in ranks.
//	[[0,1..7], [16,17..23], ... [112,113..119]]
	RANKS = [];
	for (var i = 0; i < 8; i++) {
		RANKS[i] = [16*i, 1+16*i, 2+16*i, 3+16*i, 4+16*i, 5+16*i, 6+16*i, 7+16*i];
	}

//	FILES :: Array[8 Array[8]]
//	Stores squares arranged in files.
//	[[0,16..112], [1,17..113], ... [7,23..119]]
	FILES = [];
	for (var i = 0; i < 8; i++) {
		FILES[i] = [i, 16+i, 32+i, 48+i, 64+i, 80+i, 96+i, 112+i];
	}

//	SQUARE_NAME :: Object{64}
//	Translates square value to its name.
//	{ 0:'a1', 1:'b1' ... 119:'h8' }
	SQUARE_NAME = {};
	rules.SQUARE_NAME = SQUARE_NAME;
	for (var square in SQUARES) {
		square = SQUARES[square];
		SQUARE_NAME[square] = FILE_NAMES[square.file] + RANK_NAMES[square.rank];
	}
	
//	PIECES :: Array[12]
//	Stores all possible piece codes.
//	[W|PAWN, W|KNIGHT, ... B|KING]
	PIECES = [];
	PIECE_TYPES = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];	
	for (var type in PIECE_TYPES) {
		type = PIECE_TYPES[type];
		PIECES.push(W|type);
		PIECES.push(B|type);
	}

//	FEN_TO_CODE :: Object{12}
//	Translates FEN notation symbols to piece codes.
	FEN_TO_CODE = {
		"P": W|PAWN, "N": W|KNIGHT, "B": W|BISHOP, "R": W|ROOK, "Q": W|QUEEN, "K": W|KING,
		"p": B|PAWN, "n": B|KNIGHT, "b": B|BISHOP, "r": B|ROOK, "q": B|QUEEN, "k": B|KING,
	};

//	PIECE_NAME :: Object{12}
//	Translate piece code to its name.
	PIECE_NAME = {};
	PIECE_NAME[W|PAWN] = 'pawn'; 		PIECE_NAME[B|PAWN] = 'pawn';
	PIECE_NAME[W|KNIGHT] = 'knight'; 	PIECE_NAME[B|KNIGHT] = 'knight';
	PIECE_NAME[W|BISHOP] = 'bishop'; 	PIECE_NAME[B|BISHOP] = 'bishop';
	PIECE_NAME[W|ROOK] = 'rook'; 		PIECE_NAME[B|ROOK] = 'rook';
	PIECE_NAME[W|QUEEN] = 'queen'; 		PIECE_NAME[B|QUEEN] = 'queen';
	PIECE_NAME[W|KING] = 'king'; 		PIECE_NAME[B|KING] = 'king';
	rules.PIECE_NAME = PIECE_NAME;

//	CODE_TO_FEN :: Object{12}
//	Translates piece code to FEN symbol.
	CODE_TO_FEN = {};
	CODE_TO_FEN[W|PAWN] = "P"; 			CODE_TO_FEN[B|PAWN] = "p";
	CODE_TO_FEN[W|KNIGHT] = "N";		CODE_TO_FEN[B|KNIGHT] = "n";
	CODE_TO_FEN[W|BISHOP] = "B";		CODE_TO_FEN[B|BISHOP] = "b";
	CODE_TO_FEN[W|ROOK] = "R";			CODE_TO_FEN[B|ROOK] = "r";
	CODE_TO_FEN[W|QUEEN] = "Q";			CODE_TO_FEN[B|QUEEN] = "q";
	CODE_TO_FEN[W|KING] = "K";			CODE_TO_FEN[B|KING] = "k";

//	PIECE_TYPE_NOTATION :: Object{6}
//	Translates piece type code to PGN symbol.
	PIECE_TYPE_NOTATION = {
		1: '', 2: 'N', 3: 'K', 5: 'B', 6: 'R', 7: 'Q'
	};

//	ATTACK_VECTORS :: Object{ <piece code> : Array[<vectors>] }
//	PASSIVE_VECTORS :: Object{ <piece code> : Array[<vectors>] }
	ATTACK_VECTORS = {};
	PASSIVE_VECTORS = {};
	(function calculateVectors() {
		for (var piece in PIECES) {
			piece = PIECES[piece];
			switch (piece.pieceType) {
				case PAWN:
					ATTACK_VECTORS[piece] = (piece.pieceColor) ? [-17, -15] : [17, 15];
					PASSIVE_VECTORS[piece] = (piece.pieceColor) ? [-16] : [16];
					break;
				case KNIGHT:
					ATTACK_VECTORS[piece] = [18, 33, 31, 14, -18, -33, -31, -14];
					break;
				case BISHOP:
					ATTACK_VECTORS[piece] = [17, 15, -17, -15];
					break;
				case ROOK:
					ATTACK_VECTORS[piece] = [1, 16, -1, -16];
					break;			
				case KING:
					PASSIVE_VECTORS[piece] = [-1, 1]; 
					// Fallthrough.		
				case QUEEN:
					ATTACK_VECTORS[piece] = [1, 17, 16, 15, -1, -17, -16, -15];
					break;
				default:
					throw new Error('Unknown piece type!');
			}
		}		
	}());

//	ATTACK_RAYS :: Object{64x12}
//	Stores attack rays for any piece standing on any square (on empty chessboard).
//	White Rook (22) on a1 (0) has two rays: along the "a" file and along the 1st rank:
//	ATTACKS_RAYS[0][22] = [[1,2,3,4,5,6,7], [16,32,48,64,80,96,112]]
	ATTACK_RAYS = {};
	(function calculateAttackRays() {
		for (var square in SQUARES) {
			square = SQUARES[square];
			ATTACK_RAYS[square] = {};
			for (var piece in PIECES) {
				piece = PIECES[piece];
				ATTACK_RAYS[square][piece] = ATTACK_VECTORS[piece].map(function(vector) {
					var target, ray = [], 
						range = (piece & RANGED_FLAG) ? 7 : 1;
					for (var dist = 1; dist <= range; dist++) {
						target = square + dist * vector;
						if (!target.onBoard) {
							break;
						}
						ray.push(target);
					}
					return ray;
				});
				ATTACK_RAYS[square][piece] = ATTACK_RAYS[square][piece].filter(function(ray) {
				//	Filter out empty rays.
					return !!(ray.length > 0);
				});
			}
		}		
	}());

//	PASSIVE_RAYS :: Object{64x4}
//	Stores special (non-attack) move rays. These come in two kinds:
//	1. 	Pawn moves forward (including double moves from starting squares)
//		PASSIVE_RAYS[16][17] = [[32, 48]]
//	2. 	King castling (from starting squares only)
//		PASSIVE_RAYS[4][19] = [[3, 2], [5, 6]]
	PASSIVE_RAYS = {};
	(function calculatePassiveRays() {
	//	Set passive rays for pawns.
		var PAWNS = [W|PAWN, B|PAWN],
			range, target;
		for (var square in SQUARES) {
			square = SQUARES[square];
			PASSIVE_RAYS[square] = {};
			for (var piece in PAWNS) {
				piece = PAWNS[piece];
				range = 1;
				if ((square.rank === 1) && (!piece.pieceColor)) {
				//	White pawn on second rank.
					range = 2;
				} else if ((square.rank === 6) && (piece.pieceColor)) {
				//	Black pawn on seventh rank.
					range = 2;
				}
				PASSIVE_RAYS[square][piece] = [];
				for (var dist = 1; dist <= range; dist++) {
				//	PASSIVE_VECTORS[<pawn>] == [[+-16]]
					target = square + dist * PASSIVE_VECTORS[piece][0];
					if (!target.onBoard) {
					//	Pawn moving off the board.
						delete PASSIVE_RAYS[square][piece];
						break;
					}
					PASSIVE_RAYS[square][piece].push(target);
				}
			}
		}
	//	Set passive rays for castling.
		PASSIVE_RAYS[4][W|KING] = [[5, 6], [3, 2]];
		PASSIVE_RAYS[116][B|KING] = [[117, 118], [115, 114]];			
	}());

//	ATTACK_FIELDSET :: Object{64x12}
//	Stores squares attacked from given square by each possible piece type.
// 	Values are stored in single array, as opposed to ATTACK_RAYS table,
//	which stores attacks in different direction seperately (rays).
//	ATTACK_FIELDSET[1][18] = [19, 32, 34]
	ATTACK_FIELDSET = {};
	(function calculateAttackFieldSet() {
		for (var square in SQUARES) {
			square = SQUARES[square];
			ATTACK_FIELDSET[square] = {};
			for (var piece in PIECES) {
				piece = PIECES[piece];
				ATTACK_FIELDSET[square][piece] = _.flatten(ATTACK_RAYS[square][piece]);				
			}
		}
	}());

//	QUEENING_RANK :: Object{2}
//	Stores queening rank (array of squares) for each color.
	QUEENING_RANK = {
		0: RANKS[7],
		1: RANKS[0]
	};
//	QUEENING_RANK_INDEX :: Object{2}
//	Stores queening rank for each color.
	QUEENING_RANK_INDEX = {
		0: 7,
		1: 0
	};
//	SEVENTH_RANK :: Object{2}
//	Stores 7th rank (array of squares) for each color.
	SEVENTH_RANK = {
		0: RANKS[6],
		1: RANKS[1]
	};
//	SEVENTH_RANK_INDEX :: Object{2}
//	Stores 7th rank index for each color.
	SEVENTH_RANK_INDEX = {
		0: 6,
		1: 1
	};
//	CASTLE_ROOKS :: { W: [<0-0>, <0-0-0>], B: [<0-0>, <0-0-0>] }
//	CASTLE_ROOKS[W][1].from = 0 	 	CASTLE_ROOKS[W][1].to = 3
	CASTLE_ROOKS = {
		0: [{ 'from':7, 'to':5 }, { 'from':0, 'to':3 }],
		1: [{ 'from':119, 'to':117 }, { 'from':112, 'to':115 }]
	}
	rules.CASTLE_ROOKS = CASTLE_ROOKS;
//	CASTLE_KING_TO[color][side] = square
	CASTLE_KING_TO = {
		0: [6, 2],
		1: [118, 114]
	};
//	ENPASSANT_TARGET
//	Translates enpassant destination (to square) to location of captured pawn.
//	Pawn capturing enpassant to 'a3' captures pawn on 'a4'
//	ENPASSANT_TARGET[32] = 48
	ENPASSANT_TARGET = {};
	rules.ENPASSANT_TARGET = ENPASSANT_TARGET;
	for (var i = 0; i < 8; i++) {
		ENPASSANT_TARGET[RANKS[2][i]] = RANKS[3][i];
		ENPASSANT_TARGET[RANKS[5][i]] = RANKS[4][i];
	}

//	** POSITION REPRESENTATION
//	-----------------------------------------------------
//	Position describes current location of every piece on the board.
//	However, to be useful it must also contain all necessary information
//	about current state of the game. This includes:
//	1.	Piece placement
//	2. 	Side to move
//	3. 	Castling rights for both players
//	4. 	Possible enpassant capture
//	5. 	Half-move clock (for determining 50-move draw)
//	6. 	Full-move counter (current number of move)
//
//	* FEN String Notation
//	-----------------------------------------------------
//	A common format for storing chess positions is FEN (short for
//	Forsyth-Edwards Notation). An example of FEN (starting position):
//	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
//
//	FEN strings will be used to keep track of game history (including
//	reverting back to previous positions) and for data exchange with
//	other chess applications.
//
//	* Position Object Representation
//	-----------------------------------------------------
//	Position objects offer an extended description of a position
//	and are used to store all kinds of useful infomation about current
//	state of the game. Position objects offer three useful methods:
//	.update(move)			Self-updates
// 	.yield(move)			Returns modified copy
//	.evaluate() 			Returns position's value
//
	console.log('%cDefining positions...', LOG.action);

//	validFen :: RegEx
//	Create regular expression for validating FEN strings.	
	validFen = /^([pnbrqkPNBRQK1-8\/]){17,71} ([wb]){1} ([kqKQ\-]){1,4} ([a-h36\-]){1,2} (\d){1,2} (\d){1,3}$/;
	rules.validFen = validFen;

//	position :: function()
//	Factory function, returns position object based on given FEN string.
	function position(fen) {
		console.assert(fen.match(validFen), 'Invalid FEN notation.');
	//	Property 			Description 				Method 				Description
	//	--------------------------------------------------------------------------------------------------
	//	pieces 				(fen)
	//	activeColor 		(fen)
	//	castleRights 		(fen)
	//	enpassantAt 		(fen)
	//	halfMoveClock 		(fen)
	//	fullMoveCount 		(fen)
	//	fen 				getter
	//	pieceLists 										setPieceLists
	//													updatePieceLists(move)
	//													setPieceAttacks
	//													updatePieceAttacks(move)
	//	attacked 										setAttacked
	//	checks 											setChecks
	//	pinLists 										setPins
	//	moves 											setMoves
	// 													updateMoves(move)
	//	gameOver 			getter
	//													update(move)
	//													yield(move)
	//													evaluate
	//
		var position, pieces, active, castling, enpassant, halfmove, fullmove, occupied;
		function Position() {};
		Position.prototype = Object.prototype;

		(function translateFEN() {
		//	Translates FEN notation string to individual objects.
			var tokens, rankTokens;

			tokens = fen.split(' ');
		//	tokens: 						["rnbqkbnr/...", "w", "KQkq", "-", "0", "1"]
		//	tokens[0]: 		pieces 			"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
		//	tokens[1]: 		active 		 	"w"
		//	tokens[2]: 		castling 		"KQkq"
		//	tokens[3]: 		enpassant 		"-"
		//	tokens[4]: 		halfmove 		"0"
		//	tokens[5]: 		fullmove 		"1"

			pieces = {};
		//	Modify piece placement token, by replacing each integer with a sequence of
		//	'-' characters, of length equal to the integer. ("2r4P" becomes "--r----P")
		//	This way we can get 1-to-1 map between 64 squares and 64 symbols.
			tokens[0] = tokens[0].split('/').reverse();
			for (var i = 0; i < tokens[0].length; i++) {
				rankTokens = tokens[0][i].split('');
				rankTokens = rankTokens.map(function(symbol) {
					var expandedSymbol = "";
					if (symbol.match(/[1-8]/)) {
						symbol = +(symbol);
						while (symbol > 0) {
							expandedSymbol += "-";
							symbol -= 1;
						}
						return expandedSymbol;
					} else {
						return symbol;
					}
				});
				tokens[0][i] = rankTokens.join('');				
			}

			(function setPieces() {
			//	For each square on the board with its symbol different from '-' (non-empty),
			//	create new piece object, with type determined by the symbol and bound to that square.
				var symbol;
				occupied = {};
				for (var square in SQUARES) {
					square = SQUARES[square];
					symbol = tokens[0][square.rank].charAt(square.file);
					pieces[square] = (symbol === "-") ? null : piece(FEN_TO_CODE[symbol], square);
				}
			}());

		//	Translate remaining position properties from FEN tokens.
			active = (tokens[1] === "w") ? 0 : 1;
			castling = [0, 0];
			for (var i = 0; i < tokens[2].length; i++) {
				switch (tokens[2].charAt(i)) {
					case "K": 		castling[0] += 1; break;
					case "Q": 		castling[0] += 2; break;
					case "k": 		castling[1] += 1; break;
					case "q": 		castling[1] += 2; break;
					default: 		break;
				}
			}
			enpassant = (tokens[3] === "-") ? null : tokens[3];
			halfmove = +(tokens[4]);
			fullmove = +(tokens[5]);
		}());

		position = new Position();
		Object.defineProperties(position, {
			'pieces': 			{ value: pieces, writable: true, enumerable: true },
			'activeColor':		{ value: active, writable: true, enumerable: true },
			'castleRights': 	{ value: castling, writable: true, enumerable: true },
			'enpassantAt': 		{ value: enpassant, writable: true, enumerable: true },
			'halfMoveClock': 	{ value: halfmove, writable: true, enumerable: true },
			'fullMoveCount': 	{ value: fullmove, writable: true, enumerable: true }		
		});

		Object.defineProperty(position, 'fen', {
			get: function() {
				var fen = "", rank, isEmpty, emptyCount,
				currentRank, pieceAtCurrentSquare;
			//	Piece placement.
				for (var r = 7; r >= 0; r--) {
					currentRank = RANKS[r];
					emptyCount = 0;
					for (var f = 0; f < 8; f++) {
						pieceAtCurrentSquare = this.pieces[currentRank[f]];
						if (pieceAtCurrentSquare) {
						//	Add found piece to fen string.
						//	Preceed it with number of empty squares counted.
							fen += (emptyCount || "");
							fen += CODE_TO_FEN[pieceAtCurrentSquare.code];
							emptyCount = 0;
						} else {
						//	Empty square. Continue counting.
							emptyCount += 1;
						}						
					}
					fen += (emptyCount || "");
					if (r > 0) {
						fen += "/";
					}
				}
				fen += " ";
			//	Active color.
				fen += (this.activeColor) ? "b" : "w";
				fen += " ";
			// 	Castling rights.
				if (!this.castleRights[0] && !this.castleRights[1]) {
					fen += "-";
				} else {
					fen += (this.castleRights[0] & 1) ? "K" : "";
					fen += (this.castleRights[0] & 2) ? "Q" : "";
					fen += (this.castleRights[1] & 1) ? "k" : "";
					fen += (this.castleRights[1] & 2) ? "q" : "";
				}
				fen += " ";
			//	Enpassant.
				fen += (this.enpassantAt) ? SQUARE_NAME[this.enpassantAt] : "-";
				fen += " ";
			//	Halfmove clock.
				fen += this.halfMoveClock;
				fen += " ";
			//	Full move count.
				fen += this.fullMoveCount;

				console.assert(fen.match(validFen), 'Invalid FEN string.', fen);
				return fen;
			}
		});

		(function definePieceLists() {
		//	Piece lists (seperate lists for both colors) allow quicker access to piece
		//	objects, without need to loop over entire board.
		//	pieceLists :: { 0:[<white pieces>], 1:[<black pieces>] }
		//	pieceLists.all == [<all pieces>]
		//	pieceLists.filter(17) == [<white pawns>]
		//	pieceLists.pinned == [[<white pinned>], [<black pinned>]]
			var pieceLists = {};
			Object.defineProperties(pieceLists, {
				0: 				{ value: [], writable: true, enumerable: true },
				1: 				{ value: [], writable: true, enumerable: true }
			});
			Object.defineProperty(pieceLists, 'all', {
				get: function() { return this[0].concat(this[1]); }
			});
			Object.defineProperty(pieceLists, 'filter', {
				value: function filterByCode(code) {
					var color = code.pieceColor;
					return this[color].filter(function(piece) {
						return !!(piece.code === code);
					});
				}
			});
			Object.defineProperty(pieceLists, 'pinned', {
				get: function() {
					var pinnedPieces = [];
					for (var color in COLORS) {
						pinnedPieces[color] = this[color].filter(function(piece) {
							return !!(piece.pin);
						});
					}
					return pinnedPieces;
				}
			});
			Object.defineProperty(position, 'pieceLists', {
				value: pieceLists, writable: true, enumerable: true, configurable: true
			});
		}());
		Object.defineProperty(position, 'setPieceLists', {
			value: function setPieceLists() {
				var piece;
				this.pieceLists[0] = [];
				this.pieceLists[1] = [];
				for (var square in SQUARES) {
					square = SQUARES[square];
					if (this.pieces[square]) {
						piece = this.pieces[square];
						this.pieceLists[piece.color].push(piece);
					}
				}
				console.log('%cpieceLists:', LOG.state, this.pieceLists);
			}
		});
		Object.defineProperty(position, 'updatePieceLists', {
			value: function updatePieceLists(move) {
			//	With an established position updating piece lists requires only checking for captures.
			//	Also check for promotions. Replace pointer to pawn object with pointer to new piece.
				var capturedPiece, enemy = opposite(move.color);
				if (move.isEnpassant) {
					_.remove(this.pieceLists[enemy], function(piece) {
						return !!(piece.square === ENPASSANT_TARGET[move.to]);
					});
				} else if (move.isCapture) {
					_.remove(this.pieceLists[enemy], function(piece) {
						return !!(piece.square === move.to);
					});					
				}
				if (move.isPromote) {
				//	Delete link to promoted pawn. Store new piece object.
					_.remove(this.pieceLists[move.color], function(piece) {
						return !!((piece.type === PAWN) && (piece.square.rank === QUEENING_RANK_INDEX[move.color]));
					});
					this.pieceLists[move.color].push(this.pieces[move.to]);
					console.log('%cRedirecting moveList pointer to...', LOG.action, _.last(this.pieceLists[move.color]).name);
				}
				console.log('%cpieceLists:', LOG.state, this.pieceLists);
			}
		});

		Object.defineProperty(position, 'setPieceAttacks', {
			value: function setPieceAttacks() {
				for (var piece in this.pieceLists.all) {
					piece = this.pieceLists.all[piece];
					piece.updateAttacks(this);
				}
				//console.log('%cSetting piece attacks...', LOG.action);
			}
		});
		Object.defineProperty(position, 'updatePieceAttacks', {
			value: function updatePieceAttacks(move) {
			//	Not all pieces require updating their attacks after a move.
			//	Update only applies to: moved piece and all ranged pieces.
				var pieceList = this.pieceLists.all;
				pieceList = pieceList.filter(function(piece) {
					return (piece.isRanged) || (piece.square === move.to);
				});
				for (var piece in pieceList) {
					piece = pieceList[piece];
					piece.updateAttacks(this);
				}
			}
		});
		
		Object.defineProperty(position, 'attacked', {
			writable: true, enumerable: true
		});
		Object.defineProperty(position, 'setAttacked', {
			value: function setAttacked() {
				var attacked = {};
				for (var square in SQUARES) {
					square = SQUARES[square];
					attacked[square] = [[], []];
				}
				for (var piece in this.pieceLists.all) {
					piece = this.pieceLists.all[piece];
					for (var square in piece.attacks) {
						square = piece.attacks[square];
						attacked[square][piece.color].push(piece.type);
						attacked[square][piece.color].sort();
					}
				}
				this.attacked = attacked;
			}
		});

		Object.defineProperty(position, 'checks', {
			writable: true, enumerable: true
		});
		Object.defineProperty(position, 'setChecks', {
			value: function setChecks() {
				var checks = [], attackerSquares, attackers, piece,
					own = (this.activeColor) ? B : W,
					enemy = (this.activeColor) ? W : B,
					kingSquare = this.pieceLists.filter(own|KING)[0].square;

			//	Examine checks by knights. (At most one)
				attackerSquares = ATTACK_FIELDSET[kingSquare][own|KNIGHT];
				for (var square in attackerSquares) {
					square = attackerSquares[square];
					piece = this.pieces[square];
					if (piece && (piece.code === (enemy|KNIGHT))) {
						checks.push(check([square]));
						break;
					}
				}
			//	Examine checks by pawns. (At most one pawn check possible)
			//	Skip this step if a knight check has been found. A pawn and a knight
			//	cannot be checking the king simultaneously.
				if (checks.length === 0) {
					attackerSquares = ATTACK_FIELDSET[kingSquare][own|PAWN];
					for (var square in attackerSquares) {
						square = attackerSquares[square];
						piece = this.pieces[square];
						if (piece && (piece.code === (enemy|PAWN))) {
							checks.push(check([square]));
							break;
						}
					}
				}		
			//	Examine checks along diagonals. (At most one)
				attackerSquares = ATTACK_RAYS[kingSquare][own|BISHOP];
				attackers = [enemy|BISHOP, enemy|QUEEN];
				diagonalChecks:
				for (var ray in attackerSquares) {
					ray = attackerSquares[ray];
					for (var i = 0; i < ray.length; i++) {
						piece = this.pieces[ray[i]];
						if (piece) {
							if (attackers.indexOf(piece.code) > -1) {
								ray = ray.slice(0, i + 1);
								checks.push(check(ray));
								break diagonalChecks;
							}
							break;
						}
					}
				}
			//	Examine checks along files and ranks. (At most one)
			//	Skip this step if king is already under doublecheck.
				if (checks.length < 2) {
					attackerSquares = ATTACK_RAYS[kingSquare][own|ROOK];
					attackers = [enemy|ROOK, enemy|QUEEN];
					straightChecks:
					for (var ray in attackerSquares) {
						ray = attackerSquares[ray];
						for (var i = 0; i < ray.length; i++) {
							piece = this.pieces[ray[i]];
							if (piece) {
								if (attackers.indexOf(piece.code) > -1) {
									ray = ray.slice(0, i + 1);
									checks.push(check(ray));								
									break straightChecks;
								}
								break;
							}
						}
					}	
				}
				this.checks = checks;
				this.pieces[kingSquare].checks = checks;
				console.log('%cchecks:', LOG.state, checks);
			}
		});

		(function definePinLists() {
		//	Pin lists (seperate lists for both colors) are arrays of current pins.
		//	Purpose of this object is to quickly access pins.
		//	pieceLists :: { 0:[<white pins>], 1:[<black pins>] }
		//	pieceLists.all == [<all pins>]
			var pinLists = {};
			Object.defineProperties(pinLists, {
				0: 				{ value: [], writable: true, enumerable: true },
				1: 				{ value: [], writable: true, enumerable: true }
			});
			Object.defineProperty(pinLists, 'all', {
				get: function() { return this[0].concat(this[1]); }
			});
			Object.defineProperty(position, 'pinLists', {
				value: pinLists, writable: true, enumerable: true
			});
		}());
		
		Object.defineProperty(position, 'setPins', {
			value: function setPins() {
			//	Pins are updated automatically for both colors, every time the position changes.
				var pins, newPin, attackerSquares, attackers, piece, pinnedPiece,
					own, enemy, kingSquare;

			//	Reset old pins, regardless of color.
				pins = _.flatten(this.pieceLists.pinned);
				for (var piece in pins) {
					piece = pins[piece];
					piece.pin = null;
				}
				pins = [[], []];

				for (var color in COLORS) {
					color = COLORS[color];
					own = (color) ? B : W;
					enemy = (color) ? W : B;
					kingSquare = this.pieceLists.filter(own|KING)[0].square;

				//	Examine diagonals for possible pins.
				//	Eliminate all rays shorter than 2 squares.
				//	For each ray (direction) look for own piece first, followed by
				//	enemy piece matching this ray's attack pattern.
					attackerSquares = ATTACK_RAYS[kingSquare][own|QUEEN].filter(function(ray) {
						return ray.length > 1;
					});				
					for (var ray in attackerSquares) {
						ray = attackerSquares[ray];
						attackers = ray.isDiagonal() ? [BISHOP, QUEEN] : [ROOK, QUEEN];
						pinnedPiece = null;
						for (var i = 0; i < ray.length; i++) {
							piece = this.pieces[ray[i]];
							if (piece) {	
								if (piece.color === enemy.pieceColor) {
									if (!pinnedPiece) {
									//	Enemy piece found first, no pins on this line.
									//	Continue search on next ray.
										break;	
									}
									if (attackers.indexOf(piece.type) > -1) {
									//	A pin has been found!
										newPin = pin(ray.slice(0, i + 1));
										pinnedPiece.pin = newPin;
										pins[opposite(color)].push(newPin);
										break;
									} else {
									//	Enemy piece of wrong type, cannot pin in this direction.
										break;	
									}							
								} else {								
									if (!pinnedPiece) {
									//	Own piece found first, continue looking for pinning piece.
										pinnedPiece = piece;	
									} else {
									//	Second consecutive own piece. No pins here.
										break; 	
									}
								}
							}
						}
					}
				}
			//	pinLists is an object of its own type, but its values pinLists[i] (i: 0,1),
			//	containing white and black pins respectively, are ordinary arrays.
			//	Update explicitly those arrays, as pieceLists objects don't have custom 
			//	constructor / factory function.		
				this.pinLists[WHITE] = pins[WHITE];
				this.pinLists[BLACK] = pins[BLACK];
				console.log('%cpins:', LOG.state, this.pinLists);
			}
		});

		Object.defineProperty(position, 'moves', {
			writable: true, enumerable: true
		});
		Object.defineProperty(position, 'setMoves', {
			value: function setMoves() {
				console.time('Setting moves');
			//	Generate array of all legal moves.
			//	Note some useful rules for eliminating moves:
			//	
			//	Double check			Only king can move.
			//	Check 					Non-king pieces can only move to checking ray.
			// 							Pinned pieces can't move at all.
			//	(Is pinned) 			Can only move along pinning ray.
			// 	(Pawns) 				Can't slide when pinned horizontally/diagonally.
			//							Can't capture when pinned vertically.
			//	(Knights) 				Can't move when pinned.
			// 	(Bishops) 				Can't move when pinned horizontally/vertically.
			//	(Rooks) 				Can't move when pinned diagonally.
				var ownPieceList = this.pieceLists[this.activeColor],
					moves = [];

				for (var piece in ownPieceList) {
					piece = ownPieceList[piece];
					piece.updateMoves(this);
					moves = moves.concat(piece.moves);
				}

				this.moves = moves;
				console.timeEnd('Setting moves');
				console.log('%cmoves:', LOG.state, this.moves);
			}
		});
		Object.defineProperty(position, 'updateMoves', {
			value: function updateMoves(move) {
				console.time('Updating moves');
			//	*(Duplicate of setMoves() function, to be changed) 
				var color = this.activeColor,
					ownPieceList = this.pieceLists[color],
					moves = [];

				for (var piece in ownPieceList) {
					piece = ownPieceList[piece];
					piece.updateMoves(this);
					moves = moves.concat(piece.moves);
				}

			//	Update moves in current game context.
			// 	Disambiguate move notation.
				(function eliminateCollisions() {
					console.log('%cEliminating move collisions...', LOG.action);
				//	Look for multiple:
				//	+ Knights 
				//	+ Opposite-color bishops
				//	+ Rooks
				//	+ Queens
				//	For each category:
				//		For each piece:
				//			Map available moves to destination squares.
				//		Intersect results.
				//		If result is non-empty, there is ambiguity.
				//			Pass moves in question to disambiguate()
				//
					var pieces, types, collisions;

				//	Exclude pawns and king from list of examined pieces.
				//	(Pawns capture ambiguity is already handled by adding file letter,
				//	while the king is obviously a singleton).
					pieces = _.reject(ownPieceList, function exclude(piece) {					
						return (piece.name === 'pawn') || (piece.name === 'king');
					});
					//	pieces == [
					//		N, N, B, B, Q, Q, Q
					//	]

				//	Group own pieces by piece name. Result is a { <name>: <piece> } hash.
				//	In case of bishops, split into 'dark' and 'light' complex groups.
					types = _.groupBy(pieces, function groupByName(piece) {					
						return (piece.name === 'bishop') ? piece.complex : piece.name; 
					});
					//	types == {
					//		'knight': [N, N],
					//		'dark': [B],
					//		'light': [B],
					//		'rook': [],
					//		'queen': [Q, Q, Q],
					//	}

				//	Exclude singular and empty arrays, as these are not going to create collisions.
					types = _.omit(types, function exclude(type) {					
						return type.length < 2;
					});
					//	types == {
					//		'knight': [N, N],
					//		'queen': [Q, Q, Q]
					//	}

					for (var type in types) {
						type = types[type];
						collisions = type.map(function(piece) { return piece.moves; });
						//	colisions == [
						//		[Ae4*, Ae6**, Af7], 
						//		[Bd3, Be4*],
						//		[Ce4*, Ce6**]
						//	]
						collisions = _.flatten(collisions);
						//	collsions = [
						//		Ae4*, Ae6**, Af7, Bd3, Be4*, Ce4*, Ce6**
						//	]
						collisions = _.groupBy(collisions, function(move) { return move.to });
						//	collisions = {
						//		'e4': [Ae4, Be4, Ce4],
						//		'e6': [Ae6, Ce6],
						//		'f7': [Af7],
						//		'd3': [Bd3]
						//	}
						collisions = _.omit(collisions, function exclude(collision) {
							return collision.length < 2;
						});
						//	collisions = {
						//		'e4': [Ae4, Be4, Ce4],
						//		'e6': [Ae6, Ce6]
						//	}
						if (_.size(collisions) > 0) {
							console.log('%ccollisions:', LOG.state, collisions);
						} else {
							console.log('%cNo collisions.', LOG.action);
						}
						


						for (var collision in collisions) {
							collision = collisions[collision];
							disambiguate(collision);
							console.log('%cSolved collision...', LOG.action, _.values(collision).map(function(move) { return move.san; }));
						}
					}

				}());

				this.moves = moves;
				console.timeEnd('Updating moves');
				console.log('%cmoves:', LOG.state, this.moves);
			}
		});

		Object.defineProperty(position, 'gameOver', {
			get: function() {
			//	Game results: 2bit integer [0..3]
			// 	result = <checkmate flag>|<color flag>
			//	0 		00 		Not over
			//	1 		01 		Draw
			//	2 		10 		White wins
			//	3 		11 		Black win
				console.log('%cChecking result. Legal moves:', LOG.action, this.moves.length);
				if (this.moves.length) {
					return 0;
				}
				if (this.checks.length) {
					return 2|this.color; 
				} 
				return 1;
			}
		});

		/*
		Object.defineProperties(position, {
			'update': 			{ value: function(move) { console.log('Updating position...'); } },
			'yield': 			{ value: function(move) { console.log('Yield new position...'); } },
			'evaluate': 		{ value: function() { console.log('Evaluate position...'); } }
		});
		*/

		Object.defineProperty(position, 'update', {
			value: function updatePosition(move) {
				console.assert(_move.isPrototypeOf(move), 'Invalid move.', move);
				var from = move.from, to = move.to, special = move.special,
					color = move.color, enemy = opposite(color);

				console.log('%cUpdating position after move...', LOG.action, move.san);

			//	1. Update pieces (& piece 'square' properties)
			//	Move piece to target square (occupying piece is lost). Empty initial square.
			//	Also update 'square' property of affected pieces, so that it matches new square.
				this.pieces[to] = this.pieces[from];
				this.pieces[to].square = to;
				this.pieces[from] = null;
				if (special) {
					if (special === MOVE_SPECIAL.castles[0]) {
					//	Kingside castle. Move the rook.
						this.pieces[CASTLE_ROOKS[color][0].to] = this.pieces[CASTLE_ROOKS[color][0].from];
						this.pieces[CASTLE_ROOKS[color][0].to].square = CASTLE_ROOKS[color][0].to;
						this.pieces[CASTLE_ROOKS[color][0].from] = null;
					} else if (special === MOVE_SPECIAL.castles[1]) {
					//	Queenside castle. Move the rook.
						this.pieces[CASTLE_ROOKS[color][1].to] = this.pieces[CASTLE_ROOKS[color][1].from];
						this.pieces[CASTLE_ROOKS[color][1].to].square = CASTLE_ROOKS[color][1].to;
						this.pieces[CASTLE_ROOKS[color][1].from] = null;	
					} else if (special === MOVE_SPECIAL.enpassant) {
					//	Enpassant. Om-nom-nom
						this.pieces[ENPASSANT_TARGET[to]] = null;
					} else if (move.isPromote) {
					//	A pawn has promoted. Delete it and create new piece in its place.
					//	!Important
						console.log('%cPromoting piece...', LOG.action, move.promote, move.promote.pieceType);
						delete this.pieces[to];
						this.pieces[to] = piece(move.promote, to);
						console.log('%cNew piece:', LOG.state, this.pieces[to]);
					}
				}

			//	2.	Update activeColor
				this.activeColor = enemy;

			//	3.	Update castleRights
			//	If castle is already illegal, there is no need to update.
			//	Own castle rights can be lost, when king or rook moves.
			//	Enemy castle can be disabled, when capturing a rook.
				if (this.castleRights[color]) {
					if (move.piece.pieceType === KING) {
						this.castleRights[color] = 0;
					} else if (move.piece.pieceType === ROOK) {
						if (from === CASTLE_ROOKS[color][0].from) {
							this.castleRights[color] &= 2;
						} else if (from === CASTLE_ROOKS[color][1].from) {
							this.castleRights[color] &= 1;
						}
					}
				}
				if (this.castleRights[enemy] && move.isCapture) {
					if (to === CASTLE_ROOKS[enemy][0].from) {
						this.castleRights[enemy] &= 2
					} else if (to === CASTLE_ROOKS[enemy][1].from) {
						this.castleRights[enemy] &= 1;
					}
				}
				console.log('%ccastleRights', LOG.state, this.castleRights);

			//	4. 	Update enpassantAt
				if (move.isDouble) {
					this.enpassantAt = (from + to) / 2;
				} else {
					this.enpassantAt = null;
				}
				console.log('%cenpassantAt', LOG.state, this.enpassantAt);

			//	5. 	Update halfMoveClock
				if ((move.isQuiet) && (move.piece.pieceType !== PAWN)) {
					this.halfMoveClock += 1;
				} else {
					this.halfMoveClock = 0;
				}

			//	6. 	Update fullMoveCount
				this.fullMoveCount += (color === WHITE) ? 0 : 1;

			//	Essential information about the position have been updated.
			//	Update remaining position properties:

			//	7. 	Update pieceLists
				this.updatePieceLists(move);

			//	8.	Update piece attacks
				this.updatePieceAttacks(move);

			//	9.	Update attacked
				this.setAttacked();

			//	10.	Update checks
				this.setChecks();

			//	11.	Update pins
				this.setPins();

			//	12.	Update moves
				this.updateMoves(move);
			}
		});

		return position;
	}
	rules.position = position;

//	** CHECK REPRESENTATION
//	-----------------------------------------------------
//	Information about a check is stored in a simple Check object.
//	Each check stores the following properties:
//	'ray': 				Full ray of checked squares, starting from the square 
//						adjecent to the king and up to (including) the source.
//	'source': 			(getter method) Location of the attacking piece.
//	'signature': 		
//	'isDirect': 		(getter method) Only capture moves allowed?
//	If the check is single, it can be defended by any piece stepping into
// 	checking ray (which includes capturing source of the check).
//	In the case of a double check, though, only king moves are legal.
//
	_check = {};
	Object.defineProperties(_check, {
		'ray': 			{ writable: true, configurable: true },
		'source': 		{ get: function() { return this.ray[this.ray.length - 1]; } },
		'signature': 	{ get: function() { return signature(this.ray); } },
		'isDirect': 	{ get: function() { return this.ray.length === 1; } }
	});

	function check(ray) {
		console.assert(ray.isRay(), 'Invalid checking ray.');
	//	Check factory function.
		var check;
		function Check() {};
		Check.prototype = _check;

		check = new Check();
		check.ray = ray;
		Object.freeze(check);

		console.log('%cCreating new check...', LOG.action, check);
		return check;
	}

//	** PIN REPRESENTATION
//	-----------------------------------------------------
//	Information about a pin is stored in a Pin object, similarly to check.
//	'ray': 				Pinning ray, starting from square adjecent to the king
//						and ending on the pinning piece (pin source).
//	'source': 			(getter) Square under the pinning piece.
//	'singature': 		(getter) Module of ray versor (pin direction).
//
	_pin = {};
	Object.defineProperties(_pin, {
		'ray': 			{ writable: true, configurable: true },
		'source': 		{ get: function() { return this.ray[this.ray.length - 1]; } },		
		'signature': 	{ get: function() { return signature(this.ray); } }
	});

	function pin(ray) {
		console.assert(ray.isRay() && square.onBoard, 'Invalid pin.');
	//	Pin factory function.
		var pin;
		function Pin() {};
		Pin.prototype = _pin;

		pin = new Pin();
		pin.ray = ray;
		Object.freeze(pin);

		console.log('%cCreating new pin...', LOG.action, pin);
		return pin;
	}

//	** PIECE REPRESENTATION
//	-----------------------------------------------------
//	Chess pieces have two types of representation:
//	A. Integer (stores information about piece type and color)
//	B. Piece Object (mutable object, stores all kinds of properties)
//
//	* Piece Integer Mask (code)
//	piece == color[2bit] | type[3bit]
//	-----------------------------------------------------
//	Colors: 						Types:
//	0 	00000 	(None)				0 	__000 	(None)
//	16 	10000 	White 				1 	__001 	Pawn
//	24 	11000 	Black  				2 	__010 	Knight
// 									3 	__011 	King
//									5 	__101 	Bishop
//									6	__110 	Rook
//									7 	__111 	Queen
//	-----------------------------------------------------
//	0 	00000	(None)
//	17 	10001	W Pawn 				25 	11001	B Pawn
//	18	10010	W Knight 			26	11010	B Knight
//	19 	10011	W King 				27 	11011	B King
//	21	10101 	W Bishop 			29	11101 	B Bishop
//	22 	10110 	W Rook 				30 	11110 	B Rook
//	23 	10111 	W Queen 			31 	11111 	B Queen
//
//	* Piece Object Representation
//	Piece Object stores four properties, as well as additional
//	accessor properties and methods inherited from its prototype
//	object. Each piece type has its own prototype.
//	-----------------------------------------------------
//	piece = {
//		code: <piece int mask>,
//		square: <square index>,
//		attacks: Array[] of attacked squares,
//		moves: Array[] of legal moves 
//	}
//
//	Important note (promoting pawns):
//	Promoted pawn objects don't get their 'code' switched to new piece code.
//	Instead, a new instance of Piece is created on the promotion square.
//	In general, 'code' property of a piece is meant to be immutable, whereas
//	'square', 'attacks' and 'moves' are updated every time position changes.
	console.log('%cDefining pieces...', LOG.action);

//	Piece prototype.
	_piece = {};
	Object.defineProperties(_piece, {
		'code': 			{ writable: true, configurable: true },
		'square': 			{ writable: true, configurable: true },
		'attacks': 			{ writable: true, configurable: true },
		'moves': 			{ writable: true, configurable: true },
		'color': 			{ get: function() { return this.code.pieceColor; } },
		'type': 			{ get: function() { return this.code.pieceType; } },
		'isRanged': 		{ get: function() { return !!(this.code & 4); } }
	});

	_pawn = Object.create(_piece);
	Object.defineProperties(_pawn, {
		'pin': 				{ writable: true, configurable: true },		
		'name': 			{ get: function() { return "pawn" } },
		'range': 			{ get: function() { return 1; } },
		'points': 			{ get: function() { return 1; } },
		'attackVectors': 	{ get: function() { return (this.color) ? [-17,-15] : [15,17]; } },
		'passiveVectors': 	{ get: function() { return (this.color) ? [-16] : [16]; } }
	});
	Object.defineProperty(_pawn, 'updateAttacks', {
		value: function updatePawnAttacks() {
			this.attacks = this.attackVectors.shiftSquares(this.square);
		}
	});
	Object.defineProperty(_pawn, 'updateMoves', {
		value: function updatePawnMoves(position) {		
			var from = this.square,	to, special, squaresTo, promote,
				checkCount = position.checks.length, moves = [];
		//	March forawrd!
		//	Account for pins and checks.
		//	Look out for promotions.
			promote = (from.rank === SEVENTH_RANK_INDEX[this.color]) ? (MOVE_SPECIAL_MASK.promote|MOVE_SPECIAL_MASK.queen) : 0;

			squaresTo = _.flatten(PASSIVE_RAYS[from][this.code]);
			if (checkCount) {
				if (checkCount > 1) {
					squaresTo = [];
				} else {
				//	Single check. Pawn can shield the king (maybe).
					squaresTo = _.intersection(squaresTo, position.checks[0].ray);
				//	With double move check if shielding the king doesn't require the pawn
				//	to pass through an occupied square. In that case, disallow the move.
					if (squaresTo.length && (dist(from, squaresTo[0]) === 2)) {
						if (position.pieces[from + this.passiveVectors[0]]) { 	
						//	Pawn movement blocked. (+passiveVectors[0]: one square forward)
							squaresTo = [];
						}
					}
				}
			}
			if ((squaresTo.length > 0) && this.pin) {
				squaresTo = _.intersection(squaresTo, this.pin.ray);
			}
			for (var i = 0; i < squaresTo.length; i++) {
				to = squaresTo[i];
				if (position.pieces[to]) {
				//	Obstacle on the way. Can go no further.
					break;
				}
				special = (i > 0) ? MOVE_SPECIAL.double : (0|promote);
				moves.push(move(position, from, to, special));
			}
		//	Pawn captures.
			squaresTo = this.attacks;
			if (checkCount) {
				if (checkCount > 1) {
					squaresTo = [];
				} else {
				//	Single check. Pawn can only capture the source of check.
					squaresTo = _.intersection(squaresTo, [position.checks[0].source]);
				}
			}
			if ((squaresTo.length > 0) && this.pin) {
				squaresTo = _.intersection(squaresTo, this.pin.ray);
			}
			for (var i = 0; i < squaresTo.length; i++) {
				to = squaresTo[i];
				if (position.pieces[to] && (position.pieces[to].color !== this.color)) {
				//	Enemy in capture range. Go for the eyes, Boo!
					moves.push(move(position, from, to, 4|promote));
				} else if (position.enpassantAt === to) {
				//	Enpassant capture possible. Now quickly!
					moves.push(move(position, from, to, 5));
				}
			}
			this.moves = moves;
		}		
	});

	_knight = Object.create(_piece);
	Object.defineProperties(_knight, {
		'pin': 				{ writable: true, configurable: true },
		'name': 			{ get: function() { return "knight" } },
		'range': 			{ get: function() { return 1; } },
		'points': 			{ get: function() { return 3; } },
		'attackVectors': 	{ get: function() { return [-33,-31,-18,-14,14,18,31,33]; } }
	});
	Object.defineProperty(_knight, 'updateAttacks', {
		value: function updateKnightAttacks() {
			this.attacks = this.attackVectors.shiftSquares(this.square);
		}
	});
	Object.defineProperty(_knight, 'updateMoves', {
		value: function updateKnightMoves(position) {
			var from = this.square, to, squaresTo,
				checkCount = position.checks.length, moves = [];
		//	Pinned knight can't move.
		//	Under check knight can only move to checking ray.
		//	Other than that, moves to any unoccupied or hostlie squares allowed.
			if (!this.pin) {
				squaresTo = this.attacks;
				if (checkCount) {
					if (checkCount === 1) {
					//	Single check. Knight can intercept attack.
						squaresTo = _.intersection(squaresTo, position.checks[0].ray);
					} else {
					//	Double check. Jumping is futile.
						squaresTo = [];
					}					
				}
				for (var square in squaresTo) {
					to = squaresTo[square];
					if (!position.pieces[to]) {
						moves.push(move(position, from, to, 0))
					} else if (position.pieces[to].color !== this.color) {
						moves.push(move(position, from, to, 4));
					}
				}
			}
			this.moves = moves;
		}		
	});

	_bishop = Object.create(_piece);
	Object.defineProperties(_bishop, {
		'pin': 				{ writable: true, configurable: true },
		'name': 			{ get: function() { return "bishop" } },
		'range': 			{ get: function() { return 7; } },
		'points': 			{ get: function() { return 3; } },
		'attackVectors': 	{ get: function() { return [-17,-15,15,17]; } },
		'complex': 			{ get: function() { return this.square.complex; } }
	});
	Object.defineProperty(_bishop, 'updateAttacks', {
		value: function updateBishopAttacks(position) {
			var attacks = [], rays = ATTACK_RAYS[this.square][this.code],
				piece, enemy = (this.color) ? W : B;
			for (var ray in rays) {
				ray = rays[ray];
				for (var i = 0; i < ray.length; i++) {
					attacks.push(ray[i]);
					piece = position.pieces[ray[i]];
					if (piece && (piece.code !== (enemy|KING))) {
					//	Ranged attacks end at the first occupied square.
					//	One exception is the enemy king, which counts as 'invisible'
					//	for the purpose of calculating attacked squares.
						break;
					}
				}
			}
			this.attacks = attacks;
		}
	});
	Object.defineProperty(_bishop, 'updateMoves', {
		value: function updateBishopMoves(position) {
			var from = this.square, to, squaresTo,
				checkCount = position.checks.length, moves = [];		

			squaresTo = this.attacks;
			if (checkCount) {
				if (checkCount === 1) {
					squaresTo = _.intersection(squaresTo, position.checks[0].ray);
				} else {
					squaresTo = [];
				}				
			}
			if ((squaresTo.length > 0) && this.pin) {
				squaresTo = _.intersection(squaresTo, this.pin.ray);
			}
			for (var square in squaresTo) {
				to = squaresTo[square];
				if (!position.pieces[to]) {
					moves.push(move(position, from, to, 0));
				} else if (position.pieces[to].color !== this.color) {
					moves.push(move(position, from, to, 4));
				}
			}
			this.moves = moves;
		}		
	});

	_rook = Object.create(_piece);
	Object.defineProperties(_rook, {
		'pin': 				{ writable: true, configurable: true },
		'name': 			{ get: function() { return "rook" } },
		'range': 			{ get: function() { return 7; } },
		'points': 			{ get: function() { return 5; } },
		'attackVectors': 	{ get: function() { return [-16,-1,1,16]; } }
	});
	Object.defineProperty(_rook, 'updateAttacks', {
		value: function updateRookAttacks(position) {
			var attacks = [], rays = ATTACK_RAYS[this.square][this.code],
				piece, enemy = (this.color) ? W : B;
			for (var ray in rays) {
				ray = rays[ray];
				for (var i = 0; i < ray.length; i++) {
					attacks.push(ray[i]);
					piece = position.pieces[ray[i]];
					if (piece && (piece.code !== (enemy|KING))) {
					//	Ranged attacks end at the first occupied square.
					//	One exception is the enemy king, which counts as 'invisible'
					//	for the purpose of calculating attacked squares.
						break;
					}
				}
			}
			this.attacks = attacks;
		}
	});
	Object.defineProperty(_rook, 'updateMoves', {
		value: function updateRookMoves(position) {
			var from = this.square, to, squaresTo,
				checkCount = position.checks.length, moves = [];		

			squaresTo = this.attacks;
			if (checkCount) {
				if (checkCount === 1) {
					squaresTo = _.intersection(squaresTo, position.checks[0].ray);
				} else {
					squaresTo = [];
				}				
			}
			if ((squaresTo.length > 0) && this.pin) {
				squaresTo = _.intersection(squaresTo, this.pin.ray);
			}
			for (var square in squaresTo) {
				to = squaresTo[square];
				if (!position.pieces[to]) {
					moves.push(move(position, from, to, 0));
				} else if (position.pieces[to].color !== this.color) {
					moves.push(move(position, from, to, 4));
				}
			}
			this.moves = moves;
		}		
	});

	_queen = Object.create(_piece);
	Object.defineProperties(_queen, {
		'pin': 				{ writable: true, configurable: true },
		'name': 			{ get: function() { return "queen" } },
		'range': 			{ get: function() { return 7; } },
		'points': 			{ get: function() { return 9; } },
		'attackVectors': 	{ get: function() { return [-17,-16,-15,-1,1,15,16,17]; } }
	});
	Object.defineProperty(_queen, 'updateAttacks', {
		value: function updateQueenAttacks(position) {
			var attacks = [], rays = ATTACK_RAYS[this.square][this.code],
				piece, enemy = (this.color) ? W : B;
			for (var ray in rays) {
				ray = rays[ray];
				for (var i = 0; i < ray.length; i++) {
					attacks.push(ray[i]);
					piece = position.pieces[ray[i]];
					if (piece && (piece.code !== (enemy|KING))) {
					//	Ranged attacks end at the first occupied square.
					//	One exception is the enemy king, which counts as 'invisible'
					//	for the purpose of calculating attacked squares.
						break;
					}
				}
			}
			this.attacks = attacks;
		}
	});
	Object.defineProperty(_queen, 'updateMoves', {
		value: function updateQueenMoves(position) {
			var from = this.square, to, squaresTo,
				checkCount = position.checks.length, moves = [];		

			squaresTo = this.attacks;
			if (checkCount) {
				if (checkCount === 1) {
					squaresTo = _.intersection(squaresTo, position.checks[0].ray);
				} else {
					squaresTo = [];
				}				
			}
			if ((squaresTo.length > 0) && this.pin) {
				squaresTo = _.intersection(squaresTo, this.pin.ray);
			}
			for (var square in squaresTo) {
				to = squaresTo[square];
				if (!position.pieces[to]) {
					moves.push(move(position, from, to, 0));
				} else if (position.pieces[to].color !== this.color) {
					moves.push(move(position, from, to, 4));
				}
			}
			this.moves = moves;
		}		
	});

	_king = Object.create(_piece);
	Object.defineProperties(_king, {
		'checks': 			{ writable: true, configurable: true },
		'name': 			{ get: function() { return "king" } },
		'range': 			{ get: function() { return 1; } },
		'points': 			{ get: function() { return 100; } },
		'attackVectors': 	{ get: function() { return [-17,-16,-15,-1,1,15,16,17]; } },
		'passiveVectors': 	{ get: function() { return [-1,1]; } }
	});
	Object.defineProperty(_king, 'updateAttacks', {
		value: function updateKingAttacks() {
			this.attacks = this.attackVectors.shiftSquares(this.square);
		}
	});
	Object.defineProperty(_king, 'updateMoves', {
		value: function updateKingMoves(position) {
			var from = this.square, to, squaresTo, enemy = opposite(this.color),
				checkCount = position.checks.length, moves = [];		

		//	King can move to any square not attacked by the enemy.
			squaresTo = this.attacks.filter(function(square) {
				return !position.attacked[square][enemy].length;
			});
			for (var square in squaresTo) {
				to = squaresTo[square];
				if (!position.pieces[to]) {
					moves.push(move(position, from, to, 0));
				} else if (position.pieces[to].color !== this.color) {
					moves.push(move(position, from, to, 4));
				}
			}
		//	Castling.
			if (position.castleRights[this.color] && !checkCount) {
			//	King still has some castling rights and is not under check.
				for (var side = 0; side < 2; side++) {
				//	Castling rights (2bit integer)[0..3] is a combination of flags:
				//	1: 	01 	castle kingside
				//	2: 	10 	castle queenside 
					if (position.castleRights[this.color] & (side + 1)) {
					//	Can castle on this side.
					//	Check if required squares are empty and not attacked.
						if (PASSIVE_RAYS[from][this.code][side].every(function(square) {
							return !(position.pieces[square] || position.attacked[square][enemy].length);
						})) {
							if (side === 0) {
							//	Short castle legal.
								to = CASTLE_KING_TO[this.color][0];
								moves.push(move(position, from, to, 2));	
							} else {
							//	Long castle. Check if the rook is not blocked on 'b' file.
								if (!position.pieces[this.square - 3]) {
									to = CASTLE_KING_TO[this.color][1];
									moves.push(move(position, from, to, 3));
								}	
							}
						}
	
					}
				}	
			}
			this.moves = moves;
		}		
	});

//	piece :: function()
//	Factory function, returns piece object based on piece code and square.
	function piece(code, square) {
		console.assert(code.pieceType, 'Invalid piece code.');
		console.assert(square.onBoard, 'Invalid square index.');
	//	Property 			Description 				Method 				Description
	//	--------------------------------------------------------------------------------------------------
	//	code 				
	//	square 				
	//	attacks 										updateAttacks
	//	moves											updateMoves
	//	color 				getter
	//	type 				getter
	//	isRanged 			getter
	//	range 				getter
	//	name 				getter
	//	points 				getter
	//	attackVectors 		getter
	//	*passiveVectors 	getter (P,K)
	//	*pin 				getter (P,N,B,R,Q)
	//	*checks 			getter (K)
	//
		var piece;
		function Piece() {};
		switch (code.pieceType) {
			case 1: 		Piece.prototype = _pawn; break;
			case 2: 		Piece.prototype = _knight; break;
			case 3: 		Piece.prototype = _king; break;
			case 5: 		Piece.prototype = _bishop; break;
			case 6: 		Piece.prototype = _rook; break;
			case 7: 		Piece.prototype = _queen; break;
			default: 		throw new Error('Unknown piece type.');
		}

		piece = new Piece();
		//Object.defineProperties(piece, {
		//	'code': 		{ value: code, enumerable: true, writable: false },
		//	'square': 		{ value: square, enumerable: true, writable: true }
		//});
		piece.code = code;
		piece.square = square;

		return piece;
	}

//	** MOVE REPRESENTATION
//	-----------------------------------------------------
//	Chess moves must specify starting and destination squares.
//	Castling, enpassant captures and promotions must be distinguished.
//	It's also convenient to store some additional details about the move
//	1.	From square
//	2. 	To square
//	3.	Piece being moved
//	4. 	(Piece captured)
//	5.	Special values:
//		- capture 			- promote 			- castle
// 		- enpassant 		- pawn double
//
//	Special 	Move 			Mask Composition
//	-----------------------------------------------------
//	0 			Quiet
//	1 			Double 			double
//	2 			O-O-O 			castle|long
//	3 			O-O 			castle|short
//	4 			Capture 		capture
//	5 			Enpassant 		capture|enpassant
//	
//	8 			Promote=N 		promote|knight
//	9 			Promote=B 		promote|bishop
//	10 			Promote=R 		promote|rook
//	11 			Promote=Q 		promote|queen	
//	12 			Capture=N 		promote|capture|knight
//	13 			Capture=B 		promote|capture|bishop
//	14 			Capture=R 		promote|capture|rook
//	15 			Capture=Q 		promote|capture|queen			
//
//	Mask Values
//	-----------------------------------------------------
//	double 		1 				promote 	8
// 	castle 		2 				knight 		0
//	long 		0 				bishop 		1
//	short 		1  				rook 		2
//								queen 		3
//	capture 	4
//	enpassant 	1
//
	console.log('%cDefining moves...', LOG.action);

	MOVE_SPECIAL_MASK = {
		'double': 1,
		'castle': 2, 		// 	*Not used (access via .castles[i])
		'long': 0, 			//	*Not used
		'short': 1,			//	*Not used
		'capture': 4,
		'enpassant': 1, 	//	*Not used
		'promote': 8,
		'knight': 0,
		'bishop': 1,
		'rook': 2,
		'queen': 3
	};
	MOVE_SPECIAL = {
		'double': 1,
		'castles': [2, 3],
		'capture': 4,
		'enpassant': 5,
	};

	_move = {};
	Object.defineProperties(_move, {
		'special': 		{ writable: true },
		'isCapture': 	{ get: function() { return !!(this.special & MOVE_SPECIAL_MASK.capture); } },
		'isPromote': 	{ get: function() { return !!(this.special & MOVE_SPECIAL_MASK.promote); } },
		'isCastle': 	{ get: function() { return _.contains(MOVE_SPECIAL.castles, this.special); } },
		'isEnpassant': 	{ get: function() { return !!(this.special === MOVE_SPECIAL.enpassant); } },
		'isDouble': 	{ get: function() { return this.special === MOVE_SPECIAL.double; } },
		'isQuiet': 		{ get: function() { return !this.special; } }
	});
	Object.defineProperty(_move, 'affectsOtherPieces', {
		get: function() { return this.isCapture || this.isCastle; }
	});
	Object.defineProperty(_move, 'requiresCleanup', {
		get: function() { return this.isCapture || this.isCastle || this.isPromote; }
	});

	function move(position, from, to, special) {
		console.assert(position.fen.match(validFen), 'Invalid position.');
		console.assert(from.onBoard && to.onBoard, 'Invalid from/to square index.');
		console.assert((special.isValidSpecial) || (special === undefined), 'Invalid special value.');
	//	Move factory function.
	//	position: current position object
	//	from, to: (int)[0..119]
	//	*special: (optional) move special value
	//
	//	Special move value is only necessary in case of promoting pawns.
	//	(To determine type of promoted piece). Otherwise, special value can
	//	be derived form position and move coordinates.
	// 
		var move, color, pieceCode, pieceType;
		function Move() {};
		Move.prototype = _move;
	
		if (special === undefined) {
		//	Calculate move special value, if missing.
			special = (function getMoveSpecialValue() {
				special = 0;
				if (position.pieces[from].type !== PAWN) {
				//	Non-pawn moves only have to take into account direct captures.
				//	The only exception is king's castling.
					if (position.pieces[to]) {
					//	Normal capture.
						return MOVE_SPECIAL.capture;
					}
					if ((position.pieces[from].type === KING) && (dist(from, to) > 1)) {
					//	Castle.
						return (to.file > from.file) ? MOVE_SPECIAL.castles[1] : MOVE_SPECIAL.castles[0];
					}
				} else {
				//	In case of pawn moves there are three additional possibilities:
				//	Double moves, captures enpassant and promotions.
				//	Direct captures can also combine with promoting.
					if (dist(from, to) === 2) {
					//	Double move forward.
						return MOVE_SPECIAL.double;
					}
					if (from.file !== to.file) {
					//	Captue / Enpassant capture.
						special = (position.pieces[to]) ? MOVE_SPECIAL.capture : MOVE_SPECIAL.enpassant;	
					}
					if (to.rank === QUEENING_RANK_INDEX[color]) {
					//	Promotion. Default piece: Queen.
						special |= MOVE_SPECIAL_MASK.promote | MOVE_SPECIAL_MASK.queen;	
					}
				}
				return special;
			}()); 
		}

		console.assert(position.pieces[from], 'Invalid code', from, position.pieces, position.pieces[from]);
		color = position.activeColor;
		pieceCode = position.pieces[from].code,
		pieceType = pieceCode.pieceType;									

		move = new Move();
		Object.defineProperties(move, {
			'from': 		{ value: from, enumerable: true },
			'to': 			{ value: to, enumerable: true },
			'special': 		{ value: special, enumerable: true },
			'origin': 		{ value: '', writable: true, configurable: true },
			'piece': 		{ get: function() { return pieceCode; } },
			'type': 		{ get: function() { return pieceType; } },
			'color': 		{ get: function() { return color; } },
			'san': { 
				get: function() {
				//	SAN: Standart Algebraic Notation.
				//	[piece symbol][*disambiguation][*capture][to square][*promote to][**check(mate)]
				//	Castle: O-O, O-O-O
					var notation;
					if (this.isCastle) {
						notation = (this.castle === 0) ? 'O-O-O' : 'O-O';
						return notation;
					}
				//	Piece symbol
					notation = PIECE_TYPE_NOTATION[pieceType];
				//	Disambiguation
					notation += this.origin;
				//	Capture
					if (this.isCapture) {
						if (pieceCode.pieceType === PAWN) {
						//	Pawn capture disambiguation.
							notation += FILE_NAMES[from.file];
						}
						notation += 'x';
					}
				//	Destination square
					notation += SQUARE_NAME[to];
				//	Promote
					if (this.isPromote) {
						notation += '=' + PIECE_TYPE_NOTATION[this.promote.pieceType];
					}
				//	Check / Checkmate
				//	Requires position scan. Handled elsewhere.
				//
					return notation;
				} 
			},
			'value': { 
				get: function() {
				//	Move values allow for quick pre-sorting of moves, before doing
				//	full evaluation. High value moves are evaluated first, the ones
				//	with especially low values may get ignored (as, with large
				//	probability, not worth analyzing). (Game tree pruning)
					var value = 0;
					if (this.isPromote) {
						value += 8;
					}
					if (this.isCapture) {
						switch (this.captured.pieceType) {
						//	The more valueable captured piece the better.
							case PAWN: 			value += 1; break;
							case KNIGHT: 		value += 3; break;
							case BISHOP: 		value += 3; break;
							case ROOK: 			value += 5; break;
							case QUEEN: 		value += 9; break;
							default: 			throw new Error('King capture!');
						}
						switch (this.type) {
						//	Less valuable attackers are better.
							case PAWN: 			break;
							case KNIGHT: 		value *= 0.75; break;
							case BISHOP: 		value *= 0.75; break;
							case ROOK: 			value *= 0.5; break;
							case QUEEN: 		value *= 0.3; break;
							default: 			break;
						}
					}
					if (this.isCastle) {
						value += 0.5;
					}
					if (this.isDouble) {
						value += 0.1;
					}
					return value;
				} 
			}
		});

	//	Set additional properties, if applicable.	
		if (move.isQuiet) {
			return move;
		}
		if (move.isCapture) {
			(function() {
				var capturedCode = (move.isEnpassant) ? opposite(color)|PAWN : position.pieces[to].code;				
				Object.defineProperty(move, 'captured', {
					value: capturedCode, enumerable: true
				});
			}());
		}
		if (move.isEnpassant) {
			(function() {
				var target = ENPASSANT_TARGET[to];				
				Object.defineProperty(move, 'targetAt', {
					value: target, enumerable: true
				});
			}());
			return move;
		}
		if (move.isCastle) {
			(function() {
				var castle = special % 2;				
				Object.defineProperty(move, 'castle', {
					value: castle, enumerable: true
				});
			}());
			return move;
		}
		if (move.isPromote) {
			(function() {
				var promoteTo, own = (color) ? B : W;
				switch (special % 4) {
					case MOVE_SPECIAL_MASK.knight: 		promoteTo = own|KNIGHT; break;
					case MOVE_SPECIAL_MASK.bishop: 		promoteTo = own|BISHOP; break;
					case MOVE_SPECIAL_MASK.rook: 		promoteTo = own|ROOK; break;
					default: 							promoteTo = own|QUEEN;
				}				
				Object.defineProperty(move, 'promote', {
					value: promoteTo, enumerable: true
				});
			}());
		}		

		return move;
	}

	function opposite(color) {
		console.assert((color === 0) || (color === 1), 'Invalid color.', color);
	//	Returns opposite color value (0: white, 1: black).
		return +(!color);
	}
	rules.opposite = opposite;

	function dist(x, y) {
		console.assert(x.onBoard && y.onBoard, 'Invalid square coordinates.');
	//	Defines chessboard metric (max or "taxi" metric).
	// 	Returns distance between two squares.
		return Math.max(Math.abs(x.rank - y.rank), Math.abs(x.file - y.file));
	}

	function signature(ray) {
		console.assert(ray.isRay() && (ray.length > 1), 'Invalid ray.', ray);
	//	Computes signature of a ray. Signature is a (positive) versor, which
	//	represents direction of the ray. Important values:
	//	1 	Horizontal 				15 	TopLeft-BottomRight diagonal
	//	16 	Vertical 				17 	TopRight-BottomLeft diagonal
		return Math.abs(ray[1] - ray[0]);
	}

	function disambiguate(moves) {
		console.assert(_.isArray(moves) && (moves.length > 1), 'Invalid moves array.');
	//	Assign unique origin tokens to each element in a set of ambiguous moves.
	//	For example, two Knights with possible moves to 'f3' square, would share 'Nf3' notation.
	//	Disambiguation would change their notations to 'Ndf3' and 'Ngf3'.
	//
	//	moves: 	Array[2+] of move objects.
	//	(function directly modifies referenced objects)
		var move;

		if (moves.length > 2) {
		//	For three or more pieces with the same destination, notation tokens take form
		//	of origin square name ('e4').
			for (var i = 0; i < moves.length; i++) {
				move = moves[i];
				move.origin = SQUARE_NAME[move.from]; 
			}
		} else {
		//	For two pieces sharing move destination, try to distinguish them by file ('e').
		//	If both occupy the same file, distinguish by rank ('4').
			if (moves[0].from.file !== moves[1].from.file) {
				for (var i = 0; i < 2; i++) {
					move = moves[i];
					move.origin = FILE_NAMES[move.from.file]; 
				}
			} else {
				for (var i = 0; i < 2; i++) {
					move = moves[i];
					move.origin = FILE_NAMES[move.from.rank];
				}
			}
		}
	}

	Object.freeze(rules);
	return rules;
});
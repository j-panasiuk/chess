'use strict';

//  RULES Service
//  ----------------------------------------------------------------------------
//  Define AngularJS `rules` service, providing chess rules to other modules.
//  Any chess rule can be accessed through `rules` object properties/methods,
//  as long as the service is available.
//
//  For example:
//  `rules.SQUARES`             Array of all squares on the chessboard.
//  `rules.validFen`            Regular expression for validating FEN strings.
//  `rules.proximity(0, 2)`     Get array of squares within distance:2 from square:0 (a1)   
//
//  For full API documentation, see the below.
//
//  (Note about convention)
//  CONST           All caps is only used for frozen objects (lookup tables, bitmasks).
//  _prototype      Objects with names starting with `_` are only used as prototypes for factory functions.
//  createThing     Functions starting with `create` are factories returning new instance of an object.

app.factory('rules', function(settings) {
    console.log('%cDefining basic data...', LOG.action);
//  Define chess rules.
    var rules = {};
//  Property                    Description
//  ----------------------------------------------------------------------------
//  COLORS                      List of color codes [0, 1]
//  COLOR_NAME                  Hash of color names {0:'white', 1:'black'}
//  SQUARES                     List of square codes [0, 1... 119]
//  SQUARE_NAME                 Hash of square names {0:'a1'... 119:'h8'}
//  PIECE_NAME                  Hash of piece names {17:'pawn', 18:'knight'... 31:'queen'}
//  CASTLE_ROOKS                Hash of rook move coordinates for castling.        
//  ENPASSANT_TARGET            Hash of captured pawn's coordinate (captured enpassant).
//  ACTIVITY                    Hash of piece activity at each square.
//  validFen                    RegEx for FEN string validation.
//
//  createPosition(fen)         Factory function of position objects.
//  opposite                    Returns opposite color code.
//  proximity                   Returns array of squares within given distance.

//  Declare local variables.
    var COLORS, COLOR_NAME, COLOR_MASK, SQUARES, FILE_NAMES, RANK_NAMES, SQUARE_NAME, RANKS, FILES, // Colors & squares.
        PIECES, PIECE_TYPES, PIECE_NAME, FEN_TO_CODE, CODE_TO_FEN, PIECE_TYPE_NOTATION, // Pieces.
        ATTACK_VECTORS, PASSIVE_VECTORS, ATTACK_RAYS, PASSIVE_RAYS, ATTACK_FIELDSET, // Piece attacks & movement.
        QUEENING_RANK, QUEENING_RANK_INDEX, SEVENTH_RANK, SEVENTH_RANK_INDEX, FIRST_RANK, FIRST_RANK_INDEX, // Specific ranks.
        CENTER, SEMI_CENTER, // Specific chessboard regions.
        CASTLE_ROOKS, CASTLE_KING_TO, ENPASSANT_TARGET, // Special moves & square-specific stuff.
        MOVE_SPECIAL_VALUES, MOVE_SPECIAL_MASK, MOVE_SPECIAL, // Move special values.
        ACTIVITY, // Piece activity hash.
        validFen, // Regular expression.
        _position, _check, _pin, _piece, _move, // Object prototypes.
        _pawn, _knight, _bishop, _rook, _queen, _king, // Piece prototypes.
        _pieceList, _pinList, // Object list prototypes.
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

//  SQUARES :: Array[64]
//  Stores all square values, starting from 0 = A1 up to 119 = H8.
//  [0, 1, 2... 7, 16, 17... 118, 119]
    SQUARES = [];
    rules.SQUARES = SQUARES;
    for (var i = 0; i < 128; i++) {
        if (i.onBoard) {
            SQUARES.push(i);
        }    
    }

//  FILE_NAMES, RANK_NAMES :: Array[8]
    FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];

//  RANKS :: Array[8 * Array[8]]
//  Stores squares arranged in ranks.
//  [[0,1..7], [16,17..23], ... [112,113..119]]
    RANKS = [];
    for (var i = 0; i < 8; i++) {
        RANKS[i] = [16*i, 1+16*i, 2+16*i, 3+16*i, 4+16*i, 5+16*i, 6+16*i, 7+16*i];
    }

//  FILES :: Array[8 * Array[8]]
//  Stores squares arranged in files.
//  [[0,16..112], [1,17..113], ... [7,23..119]]
    FILES = [];
    for (var i = 0; i < 8; i++) {
        FILES[i] = [i, 16+i, 32+i, 48+i, 64+i, 80+i, 96+i, 112+i];
    }

//  SQUARE_NAME :: Object{64}
//  Translates square value to its name.
//  { 0:'a1', 1:'b1' ... 119:'h8' }
    SQUARE_NAME = {};
    rules.SQUARE_NAME = SQUARE_NAME;
    for (var square in SQUARES) {
        square = SQUARES[square];
        SQUARE_NAME[square] = FILE_NAMES[square.file] + RANK_NAMES[square.rank];
    }
    
//  PIECES :: Array[12]
//  Stores all possible piece codes.
//  [W|PAWN, W|KNIGHT, ... B|KING]
    PIECES = [];
    PIECE_TYPES = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];    
    for (var type in PIECE_TYPES) {
        type = PIECE_TYPES[type];
        PIECES.push(W|type);
        PIECES.push(B|type);
    }

//  FEN_TO_CODE :: Object{12}
//  Translates FEN notation symbols to piece codes.
    FEN_TO_CODE = {
        "P": W|PAWN, "N": W|KNIGHT, "B": W|BISHOP, "R": W|ROOK, "Q": W|QUEEN, "K": W|KING,
        "p": B|PAWN, "n": B|KNIGHT, "b": B|BISHOP, "r": B|ROOK, "q": B|QUEEN, "k": B|KING,
    };

//  PIECE_NAME :: Object{12}
//  Translate piece code to its name.
    PIECE_NAME = {};
    PIECE_NAME[W|PAWN] = 'pawn';        PIECE_NAME[B|PAWN] = 'pawn';
    PIECE_NAME[W|KNIGHT] = 'knight';    PIECE_NAME[B|KNIGHT] = 'knight';
    PIECE_NAME[W|BISHOP] = 'bishop';    PIECE_NAME[B|BISHOP] = 'bishop';
    PIECE_NAME[W|ROOK] = 'rook';        PIECE_NAME[B|ROOK] = 'rook';
    PIECE_NAME[W|QUEEN] = 'queen';      PIECE_NAME[B|QUEEN] = 'queen';
    PIECE_NAME[W|KING] = 'king';        PIECE_NAME[B|KING] = 'king';
    rules.PIECE_NAME = PIECE_NAME;

//  CODE_TO_FEN :: Object{12}
//  Translates piece code to FEN symbol.
    CODE_TO_FEN = {};
    CODE_TO_FEN[W|PAWN] = "P";          CODE_TO_FEN[B|PAWN] = "p";
    CODE_TO_FEN[W|KNIGHT] = "N";        CODE_TO_FEN[B|KNIGHT] = "n";
    CODE_TO_FEN[W|BISHOP] = "B";        CODE_TO_FEN[B|BISHOP] = "b";
    CODE_TO_FEN[W|ROOK] = "R";          CODE_TO_FEN[B|ROOK] = "r";
    CODE_TO_FEN[W|QUEEN] = "Q";         CODE_TO_FEN[B|QUEEN] = "q";
    CODE_TO_FEN[W|KING] = "K";          CODE_TO_FEN[B|KING] = "k";

//  PIECE_TYPE_NOTATION :: Object{6}
//  Translates piece type code to PGN symbol.
    PIECE_TYPE_NOTATION = {
        1: '', 2: 'N', 3: 'K', 5: 'B', 6: 'R', 7: 'Q'
    };

//  ATTACK_VECTORS :: Object{ <piece code> : Array[<vectors>] }
//  PASSIVE_VECTORS :: Object{ <piece code> : Array[<vectors>] }
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

//  ATTACK_RAYS :: Object{64x12}
//  Stores attack rays for any piece standing on any square (on empty chessboard).
//  White Rook (22) on a1 (0) has two rays: along the "a" file and along the 1st rank:
//  ATTACKS_RAYS[0][22] = [[1,2,3,4,5,6,7], [16,32,48,64,80,96,112]]
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
                //    Filter out empty rays.
                    return !!(ray.length > 0);
                });
            }
        }        
    }());

//  PASSIVE_RAYS :: Object{64x4}
//  Stores special (non-attack) move rays. These come in two kinds:
//  1.  Pawn moves forward (including double moves from starting squares)
//      PASSIVE_RAYS[16][17] = [[32, 48]]
//  2.  King castling (from starting squares only)
//      PASSIVE_RAYS[4][19] = [[3, 2], [5, 6]]
    PASSIVE_RAYS = {};
    (function calculatePassiveRays() {
    //  Set passive rays for pawns.
        var PAWNS = [W|PAWN, B|PAWN],
            range, target;
        for (var square in SQUARES) {
            square = SQUARES[square];
            PASSIVE_RAYS[square] = {};
            for (var piece in PAWNS) {
                piece = PAWNS[piece];
                range = 1;
                if ((square.rank === 1) && (!piece.pieceColor)) {
                //  White pawn on second rank.
                    range = 2;
                } else if ((square.rank === 6) && (piece.pieceColor)) {
                //  Black pawn on seventh rank.
                    range = 2;
                }
                PASSIVE_RAYS[square][piece] = [];
                for (var dist = 1; dist <= range; dist++) {
                //  PASSIVE_VECTORS[<pawn>] == [[+-16]]
                    target = square + dist * PASSIVE_VECTORS[piece][0];
                    if (!target.onBoard) {
                    //  Pawn moving off the board.
                        delete PASSIVE_RAYS[square][piece];
                        break;
                    }
                    PASSIVE_RAYS[square][piece].push(target);
                }
            }
        }
    //  Set passive rays for castling.
        PASSIVE_RAYS[4][W|KING] = [[5, 6], [3, 2]];
        PASSIVE_RAYS[116][B|KING] = [[117, 118], [115, 114]];
    }());

//  ATTACK_FIELDSET :: Object{64x12}
//  Stores squares attacked from given square by each possible piece type.
//  Values are stored in single array, as opposed to ATTACK_RAYS table,
//  which stores attacks in different direction seperately (rays).
//  ATTACK_FIELDSET[1][18] = [19, 32, 34]
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

//  QUEENING_RANK :: Object{2}
//  Stores queening rank (array of squares) for each color.
    QUEENING_RANK = {
        0: RANKS[7],
        1: RANKS[0]
    };
//  QUEENING_RANK_INDEX :: Object{2}
//  Stores queening rank for each color.
    QUEENING_RANK_INDEX = {
        0: 7,
        1: 0
    };
//  SEVENTH_RANK :: Object{2}
//  Stores 7th rank (array of squares) for each color.
    SEVENTH_RANK = {
        0: RANKS[6],
        1: RANKS[1]
    };
//  SEVENTH_RANK_INDEX :: Object{2}
//  Stores 7th rank index for each color.
    SEVENTH_RANK_INDEX = {
        0: 6,
        1: 1
    };
//  FIRST_RANK :: Object{2}
//  Stores 1st rank (array of squares) for each color.
    FIRST_RANK = {
        0: RANKS[0],
        1: RANKS[7]
    };
//  FIRST_RANK_INDEX :: Object{2}
//  Stores 1st rank index for each color.
    SEVENTH_RANK_INDEX = {
        0: 0,
        1: 7
    };
//  CASTLE_ROOKS :: { W: [<0-0>, <0-0-0>], B: [<0-0>, <0-0-0>] }
//  CASTLE_ROOKS[W][1].from = 0          
//  CASTLE_ROOKS[W][1].to = 3
    CASTLE_ROOKS = {
        0: [{ 'from':7, 'to':5 }, { 'from':0, 'to':3 }],
        1: [{ 'from':119, 'to':117 }, { 'from':112, 'to':115 }]
    }
    rules.CASTLE_ROOKS = CASTLE_ROOKS;
//  CASTLE_KING_TO[color][side] = square
    CASTLE_KING_TO = {
        0: [6, 2],
        1: [118, 114]
    };
//  ENPASSANT_TARGET
//  Translates enpassant destination (to square) to location of captured pawn.
//  Pawn capturing enpassant to 'a3' captures pawn on 'a4'
//  ENPASSANT_TARGET[32] = 48
    ENPASSANT_TARGET = {};
    rules.ENPASSANT_TARGET = ENPASSANT_TARGET;
    for (var i = 0; i < 8; i++) {
        ENPASSANT_TARGET[RANKS[2][i]] = RANKS[3][i];
        ENPASSANT_TARGET[RANKS[5][i]] = RANKS[4][i];
    }

//  CENTER
    CENTER = [51, 52, 67, 68];
//  SEMI_CENTER
    SEMI_CENTER = [34, 35, 36, 37, 50, 51, 52, 53, 66, 67, 68, 69, 82, 83, 84, 85];

//  ACTITITY
//  Translates piece code and its current location to activity value.
//  The better square a piece occupies the higher its activity value.
//  Activity doesn't take into account positions of other pieces or any other factors.
//  (Knight on b1 value +1)         ACTIVITY[W|KNIGHT][1] = 1
//  (Knight on e6 value +7)         ACTIVITY[W|KNIGHT][84] = 7    
    ACTIVITY = {};
    rules.ACTIVITY = ACTIVITY;

    ACTIVITY[W|PAWN] = {};          ACTIVITY[B|PAWN] = {};    
    ACTIVITY[W|KNIGHT] = {};        ACTIVITY[B|KNIGHT] = {};    
    ACTIVITY[W|BISHOP] = {};        ACTIVITY[B|BISHOP] = {};    
    ACTIVITY[W|ROOK] = {};          ACTIVITY[B|ROOK] = {};    
    ACTIVITY[W|QUEEN] = {};         ACTIVITY[B|QUEEN] = {};    
    ACTIVITY[W|KING] = {};          ACTIVITY[B|KING] = {};    

    (function calculatePawnActivity() {
        var square, activity;

        for (var i = 0; i < SQUARES.length; i++) {
            square = SQUARES[i];
            activity = fileValue(square.file) + centralization(square);
            ACTIVITY[W|PAWN][square] = activity + advancement(WHITE, square.rank);
            ACTIVITY[B|PAWN][square] = activity + advancement(BLACK, square.rank);
        }

        function advancement(color, rank) {
        //  Return bonus for pawn advanced position.
        //  (Use multiplier later, if the pawn is passed!)
        //  Rank:           2    3    4    5    6    7 
        //  Bonus:          0    1    2    4    8    20
            switch (rank) {                
                case 1:     return color ? 20 : 0; break;
                case 6:     return color ? 0 : 20; break;
                case 2:     return color ? 8 : 1; break;
                case 5:     return color ? 1 : 8; break;
                case 3:     return color ? 4 : 2; break;
                case 4:     return color ? 2 : 4; break;
            //  First and last rank added for consistency measures.
                case 0:     return color ? 50 : 0; break;
                case 7:     return color ? 0 : 50; break;
                default:     return 0;
            }
        }

        function fileValue(file) {
            console.assert(_.contains(_.range(8), file), 'Invalid file index.', file);
        //  Return bonus points for file centralization.
        //  A    B    C    D    E    F    G    H
        //  0    1    2    3    3    2    1    0
            return 3.5 - Math.abs(file - 3.5);
        }

        function centralization(square) {
            console.assert(square.onBoard, 'Invalid square.', square);
        //  Return bonus points for central position.
        //  CENTER: 4         SEMI_CENTER: 2         (default): 0
            return _.contains(SEMI_CENTER, square) ? (_.contains(CENTER, square) ? 4 : 2) : 0;
        }
    }());

    (function calculateKnightActivity() {
        var square, activity;

        for (var i = 0; i < SQUARES.length; i++) {
            square = SQUARES[i];
            activity = centralization(square);
            ACTIVITY[W|KNIGHT][square] = activity + advancement(WHITE, square.rank);
            ACTIVITY[B|KNIGHT][square] = activity + advancement(BLACK, square.rank);
        }

        function advancement(color, rank) {
        //  Return bonus for knight advanced position.
        //  Rank:         0    1    2    3    4    5    6    7 
        //  Bonus:        0    0    0    0    1    2    1    0
            if (color) {
                switch (rank) {
                    case 3:     return 1; break;
                    case 2:     return 2; break;
                    case 1:     return 1; break;
                    default:    return 0;
                }
            } else {
                switch (rank) {
                    case 4:     return 1; break;
                    case 5:     return 2; break;
                    case 6:     return 1; break;
                    default:    return 0;
                }
            }
        }

        function centralization(square) {
            console.assert(square.onBoard, 'Invalid square.', square);
        //  Return bonus points for square centralization.
        //  Adds bonus for both coordinates (rank & file).
        //  0  1  2  3  3  2  1  0
        //  1  2  3  4  4  3  2  1 
        //  2  3  4  5  5  4  3  2
        //  3  4  5  6  6  5  4  3
        //  3  4  5  6  6  5  4  3
        //  2  3  4  5  5  4  3  2
        //  1  2  3  4  4  3  2  1
        //  0  1  2  3  3  2  1  0
            return 7 - Math.abs(square.file - 3.5) - Math.abs(square.rank - 3.5);
        }
    }());

    (function calculateBishopActivity() {
        var square;

        for (var i = 0; i < SQUARES.length; i++) {
            square = SQUARES[i];
            ACTIVITY[W|BISHOP][square] = scope(square);
            ACTIVITY[B|BISHOP][square] = scope(square);
        }

        function scope(square) {
        //  Return bonus for bishop's scope.
        //  3  2  1  0  0  1  2  3
        //  2  4  3  2  2  3  4  2 
        //  2  3  4  3  3  4  3  2
        //  1  2  3  4  4  3  2  1
        //  1  2  3  4  4  3  2  1
        //  2  3  4  3  3  4  3  2
        //  2  4  3  2  2  3  4  2
        //  3  2  1  0  0  1  2  3
            return 0;
        }
    }());

    (function calculateRookActivity() {
        var square;

        for (var i = 0; i < SQUARES.length; i++) {
            square = SQUARES[i];
            ACTIVITY[W|ROOK][square] = advancement(WHITE, square.rank);
            ACTIVITY[B|ROOK][square] = advancement(BLACK, square.rank);
        }

        function advancement(color, rank) {
        //  Return bonus for rook's activity.
        //  10 10 10 10 10 10 10 10
        //  8  8  8  8  8  8  8  8 
        //  0  0  0  0  0  0  0  0
        //  0  0  0  0  0  0  0  0
        //  0  0  0  0  0  0  0  0
        //  0  0  0  0  0  0  0  0
        //  0  0  0  0  0  0  0  0
        //  0  0  0  0  0  0  0  0
            switch (rank) {
                case (color ? 1 : 6):    return 8; break;
                case (color ? 0 : 7):    return 10; break;
                default:                 return 0;
            }
        }
    }());

    (function calculateQueenActivity(){
        SQUARES.forEach(function(square) {
            ACTIVITY[W|QUEEN][square] = 0;
            ACTIVITY[B|QUEEN][square] = 0;
        });
    }());

    (function calculateKingActivity(){
        SQUARES.forEach(function(square) {
            ACTIVITY[W|KING][square] = 0;
            ACTIVITY[B|KING][square] = 0;
        });
    }());


//  ** POSITION REPRESENTATION
//  -----------------------------------------------------
//  Position describes current location of every piece on the board.
//  However, to be useful it must also contain all necessary information
//  about current state of the game. This includes:
//  1.  Piece placement
//  2.  Side to move
//  3.  Castling rights for both players
//  4.  Possible enpassant capture
//  5.  Half-move clock (for determining 50-move draw)
//  6.  Full-move counter (current number of move)
//
//  * FEN String Notation
//  -----------------------------------------------------
//  A common format for storing chess positions is FEN (short for
//  Forsyth-Edwards Notation). An example of FEN (starting position):
//  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
//
//  FEN strings will be used to keep track of game history (including
//  reverting back to previous positions) and for data exchange with
//  other chess applications.
//
//  * Position Object Representation
//  -----------------------------------------------------
//  Position objects offer an extended description of a position
//  and are used to store all kinds of useful infomation about current
//  state of the game. Position objects offer three useful methods:
//  .update(move)           Self-updates
//  .yields(move)           Returns modified copy
//  .evaluate()             Returns position's value
//
    console.log('%cDefining positions...', LOG.action);

    _position = {};
    Object.defineProperties(_position, {
    //  Core position properties (FEN)
        'pieces':               { writable: true, enumerable: true, configurable: true },
        'activeColor':          { writable: true, enumerable: true, configurable: true },
        'castleRights':         { writable: true, enumerable: true, configurable: true },
        'enpassantAt':          { writable: true, enumerable: true, configurable: true },
        'halfMoveClock':        { writable: true, enumerable: true, configurable: true },
        'fullMoveCount':        { writable: true, enumerable: true, configurable: true },
    //  Derived properties (updated based on core properties)
        'attacked':             { writable: true, enumerable: true, configurable: true },
        'checks':               { writable: true, enumerable: true, configurable: true },
        'moves':                { writable: true, enumerable: true, configurable: true },
    //  List objects (hashtables with data for both colors)
        'pieceList':            { writable: true, enumerable: true, configurable: true },
        'pinList':              { writable: true, enumerable: true, configurable: true },
    //  Accessor properties and methods
        'fen': {
            get: function() {
            //  Return current position's FEN string representation.
                var rank, isEmpty, emptyCount, currentRank, pieceAtCurrentSquare,
                    fen = "";
            //  Piece placement.
                for (var r = 7; r >= 0; r--) {
                    currentRank = RANKS[r];
                    emptyCount = 0;
                    for (var f = 0; f < 8; f++) {
                        pieceAtCurrentSquare = this.pieces[currentRank[f]];
                        if (pieceAtCurrentSquare) {
                        //  Add found piece to fen string.
                        //  Preceed it with number of empty squares counted.
                            fen += (emptyCount || "");
                            fen += CODE_TO_FEN[pieceAtCurrentSquare.code];
                            emptyCount = 0;
                        } else {
                        //  Empty square. Continue counting.
                            emptyCount += 1;
                        }                        
                    }
                    fen += (emptyCount || "");
                    if (r > 0) {
                        fen += "/";
                    }
                }
                fen += " ";
            //  Active color.
                fen += (this.activeColor) ? "b" : "w";
                fen += " ";
            //  Castling rights.
                if (!this.castleRights[0] && !this.castleRights[1]) {
                    fen += "-";
                } else {
                    fen += (this.castleRights[0] & 1) ? "K" : "";
                    fen += (this.castleRights[0] & 2) ? "Q" : "";
                    fen += (this.castleRights[1] & 1) ? "k" : "";
                    fen += (this.castleRights[1] & 2) ? "q" : "";
                }
                fen += " ";
            //  Enpassant.
                fen += (this.enpassantAt) ? SQUARE_NAME[this.enpassantAt] : "-";
                fen += " ";
            //  Halfmove clock.
                fen += this.halfMoveClock;
                fen += " ";
            //  Full move count.
                fen += this.fullMoveCount;

                console.assert(fen.match(validFen), 'Invalid FEN string.', fen);
                return fen;
            },
            set: function(fen) {
            //  Update position object to match given fen string.
                var iteration, ranks, pieces, castle,
                    tokens = {};
                
                iteration = 0;
                fen.split(' ').forEach(function(token) { 
                    switch (iteration) {
                        case 0:     tokens.pieces = token; break;
                        case 1:     tokens.active = token; break;
                        case 2:     tokens.castle = token; break;
                        case 3:     tokens.enpassant = token; break;
                        case 4:     tokens.halfmove = token; break;
                        case 5:     tokens.fullmove = token; break;
                    }
                    iteration += 1;
                });

            //  Modify piece placement token, by replacing each integer with a sequence of
            //  '-' characters, of length equal to the integer. ("2r4P" becomes "--r----P")
            //  This way we can get 1-to-1 map between 64 squares and 64 symbols.
                tokens.pieces = tokens.pieces.split('/').reverse();
                for (var i = 0; i < tokens.pieces.length; i++) {
                    ranks = tokens.pieces[i].split('');
                    ranks = ranks.map(function translateDigits(symbol) {
                        var expandedSymbol = '';
                        if (symbol.match(/[1-8]/)) {
                            symbol = +(symbol);
                            while (symbol > 0) {
                                expandedSymbol += '-';
                                symbol -= 1;
                            }
                            return expandedSymbol;
                        } else {
                            return symbol;
                        }
                    });
                    tokens.pieces[i] = ranks.join('');                
                }

                pieces = {};
            //  For each square on the board with its symbol different from '-' (non-empty),
            //  create new piece object, with type determined by the symbol and bound to that square.
                SQUARES.forEach(function(square) {
                    var symbol = tokens.pieces[square.rank].charAt(square.file);
                    pieces[square] = (symbol === '-') ? null : createPiece(FEN_TO_CODE[symbol], square);
                });
                this.pieces = pieces;

            //  Translate remaining position properties from FEN tokens.
                this.activeColor = (tokens.active === 'w') ? 0 : 1;
                castle = [0, 0];
                for (var i = 0; i < tokens.castle.length; i++) {
                    switch (tokens.castle.charAt(i)) {
                        case 'K':         castle[0] += 1; break;
                        case 'Q':         castle[0] += 2; break;
                        case 'k':         castle[1] += 1; break;
                        case 'q':         castle[1] += 2; break;
                    }
                }
                this.castleRights = castle;
                this.enpassantAt = (tokens.enpassant === '-') ? null : tokens.enpassant;
                this.halfMoveClock = +tokens.halfmove;
                this.fullMoveCount = +tokens.fullmove;
            }
        },
        'setPieceList': {
            value: function() {
                this.pieceList = createPieceList(this);
            }
        },
        'updatePieceList': {
            value: function(move) {
                var color = move.color,
                    enemy = +!color;

                if (move.isQuiet || move.isDouble || move.isCastle) {
                    return;
                }
                if (move.isEnpassant) {
                    _.remove(this.pieceList[enemy], function(piece) {
                        return piece.square === ENPASSANT_TARGET[move.to];
                    });
                    return;
                }
                if (move.isCapture) {
                    _.remove(this.pieceList[enemy], function(piece) {
                        return piece.square === move.to;
                    });
                    return;
                }
                if (move.isPromote) {
                //  Replace captured piece object with promoted piece.
                    _.remove(this.pieceList[color], function(piece) {
                        return piece.square === move.to;
                    });
                    this.pieceList[color].push(this.pieces[move.to]);
                }
            }
        },
        'setPieceAttacks': {
            value: function() {
            //  Update all pieces' `attacks` values to match current position.
                var pieces = this.pieceList.all;
                for (var i = 0; i < pieces.length; i++) {
                    pieces[i].updateAttacks(this);
                }
            }
        },
        'updatePieceAttacks': {
            value: function(move) {
            //  Not all pieces require updating their attacks after a move.
            //  Update only applies to the moved piece and all ranged pieces.
                var pieces = this.pieceList.all.filter(function(piece) {
                    return (piece.isRanged) || (piece.square === move.to);
                });
                for (var i = 0; i < pieces.length; i++) {
                    pieces[i].updateAttacks(this);
                }
            }
        },
        'setAttacked': {
            value: function() {
                var attacked = {};
                SQUARES.forEach(function(square) { attacked[square] = [[], []]; });
                this.pieceList.all.forEach(function(piece) {
                    for (var i = 0; i < piece.attacks.length; i++) {
                        square = piece.attacks[i];
                        attacked[square][piece.color].push(piece.type);
                        attacked[square][piece.color].sort();
                    }
                });
                this.attacked = attacked;
            }
        },
        'setChecks': {
            value: function() {
                var attackerSquares, attackers, piece,
                    own = (this.activeColor) ? B : W,
                    enemy = (this.activeColor) ? W : B,
                    king = this.pieceList.kings(this.activeColor)[0],
                    kingSquare = king.square,
                    checks = [];

            //  Examine checks by knights. (At most one)
                attackerSquares = ATTACK_FIELDSET[kingSquare][own|KNIGHT];
                for (var square in attackerSquares) {
                    square = attackerSquares[square];
                    piece = this.pieces[square];
                    if (piece && (piece.code === (enemy|KNIGHT))) {
                        checks.push(createCheck([square]));
                        break;
                    }
                }            
            //  Examine checks by pawns. (At most one pawn check possible)
            //  Skip this step if a knight check has been found. A pawn and a knight
            //  cannot be checking the king simultaneously.
                if (checks.length === 0) {
                    attackerSquares = ATTACK_FIELDSET[kingSquare][own|PAWN];
                    for (var square in attackerSquares) {
                        square = attackerSquares[square];
                        piece = this.pieces[square];
                        if (piece && (piece.code === (enemy|PAWN))) {
                            checks.push(createCheck([square]));
                            break;
                        }
                    }
                }
            //  Examine checks along diagonals. (At most one)
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
                                checks.push(createCheck(ray));
                                break diagonalChecks;
                            }
                            break;
                        }
                    }
                }
            //  Examine checks along files and ranks. (At most one)
            //  Skip this step if king is already under doublecheck.
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
                                    checks.push(createCheck(ray));
                                    break straightChecks;
                                }
                                break;
                            }
                        }
                    }    
                }
                this.checks = checks;
                king.checks = checks;
                //this.pieces[kingSquare].checks = checks;
                console.log('%cchecks:', LOG.state, checks);
            }
        },
        'setPinList': {
            value: function() {
                this.pinList = createPinList();
            }
        },
        'setPins': {
            value: function() {
                var pins, // Array with found pins: [[white pins], [black pins]]
                    pin, // Pin object.
                    own, // Color mask matching the pinned piece.
                    enemy, // Color mask of the attacker.
                    king, // King object.
                    kingSquare, // Square occupied by the king.
                    attackerSquares, // Array of possible attack vectors (rays)
                                     // (One ray for each direction, including knight vectors)
                    attackers, // Array of attacker piece types.
                    piece, // Piece object.
                    pinnedPiece; // Piece object under pin.

            //  Reset old pins, regardless of color.
                this.pieceList.all.forEach(function(piece) {
                    if (piece.pin) {
                        piece.pin = null;
                    }
                });
                pins = [[], []];
                
                for (var color in COLORS) {
                    color = COLORS[color];
                    own = (color) ? B : W;
                    enemy = (color) ? W : B;
                    king = this.pieceList.kings(color)[0];
                    kingSquare = king.square;

                //  Examine diagonals for possible pins.
                //  Eliminate all rays shorter than 2 squares.
                //  For each ray (direction) look for own piece first, followed by
                //  enemy piece matching this ray's attack pattern.
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
                                    //  Enemy piece found first, no pins on this line.
                                    //  Continue search on next ray.
                                        break;    
                                    }
                                    if (attackers.indexOf(piece.type) > -1) {
                                    //  A pin has been found!
                                        pin = createPin(ray.slice(0, i + 1));
                                        pinnedPiece.pin = pin;
                                        pins[opposite(color)].push(pin);
                                        break;
                                    } else {
                                    //  Enemy piece of wrong type, cannot pin in this direction.
                                        break;
                                    }
                                } else {
                                    if (!pinnedPiece) {
                                    //  Own piece found first, continue looking for pinning piece.
                                        pinnedPiece = piece;
                                    } else {
                                    //  Second consecutive own piece. No pins here.
                                        break;
                                    }
                                }
                            }
                        }

                    }
                }

            //  pinList is an object of its own type, but its values pinList[i] (i: 0,1),
            //  containing white and black pins respectively, are ordinary arrays.
            //  Update explicitly those arrays, as pieceList objects don't have custom 
            //  constructor / factory function.
                //this.pinList = createPinList();
                this.pinList[0] = pins[0];
                this.pinList[1] = pins[1];
                console.log('%cpins:', LOG.state, this.pinList.all);
            }
        },
        'setMoves': {
            value: function() {
                var piece, // Piece object.
                    types, // Hashtable of piece objects, grouped by piece type names.
                    collisions,
                    pieces = this.pieceList[this.activeColor], // List of active piece objects.
                    moves = []; // List of move objects available in current position.

                for (var i = 0; i < pieces.length; i++) {
                    piece = pieces[i];
                    piece.updateMoves(this);
                    moves = moves.concat(piece.moves);
                }

            //  Update moves in current game context. Disambiguate move notation.    
            //  (It is often possible for multiple pieces of the same kind to move to the same square.
            //  Short Algebraic Notation (SAN) requires the moves to be uniquely represented to avoid
            //  ambiguity. Namespace collisions can only be determined in the context of entire position,
            //  thus `position.moves` object is disambiguated after every position change)

            //  Exclude pawns and king from list of examined pieces.
            //  (Pawns capture ambiguity is already handled by adding file letter,
            //  while the king is obviously a singleton).
                pieces = _.reject(pieces, function(piece) {
                    return (piece.name === 'pawn') || (piece.name === 'king');
                });
                //    EXPECT: pieces == [
                //        N, N, B, B, Q, Q, Q
                //    ]

            //    Group own pieces by piece name. Result is a { <name>: <piece> } hash.
            //    In case of bishops, split into 'dark' and 'light' complex groups.
                types = _.groupBy(pieces, function(piece) {
                    return (piece.name === 'bishop') ? piece.complex : piece.name; 
                });
                //    EXPECT: types == {
                //        'knight': [N, N],
                //        'dark': [B],
                //        'light': [B],
                //        'rook': [],
                //        'queen': [Q, Q, Q],
                //    }

            //    Exclude singular and empty arrays, as these are not going to create collisions.
                types = _.omit(types, function exclude(type) {
                    return type.length < 2;
                });
                //    EXPECT: types == {
                //        'knight': [N, N],
                //        'queen': [Q, Q, Q]
                //    }

                for (var type in types) {
                    type = types[type];
                    collisions = type.map(function(piece) { return piece.moves; });
                    //    EXPECT: colisions == [
                    //        [Ae4*, Ae6**, Af7], 
                    //        [Bd3, Be4*],
                    //        [Ce4*, Ce6**]
                    //    ]
                    collisions = _.flatten(collisions);
                    //    EXPECT: collsions = [
                    //        Ae4*, Ae6**, Af7, Bd3, Be4*, Ce4*, Ce6**
                    //    ]
                    collisions = _.groupBy(collisions, function(move) { return move.to });
                    //    EXPECT: collisions = {
                    //        'e4': [Ae4, Be4, Ce4],
                    //        'e6': [Ae6, Ce6],
                    //        'f7': [Af7],
                    //        'd3': [Bd3]
                    //    }
                    collisions = _.omit(collisions, function exclude(collision) {
                        return collision.length < 2;
                    });
                    //    EXPECT: collisions = {
                    //        'e4': [Ae4, Be4, Ce4],
                    //        'e6': [Ae6, Ce6]
                    //    }
                    if (_.size(collisions) > 0) {
                        console.log('%ccollisions:', LOG.state, collisions);
                    } else {
                        console.log('%cNo collisions.', LOG.action);
                    }

                    _.values(collisions).forEach(function(collision) { disambiguate(collision); });
                }

                this.moves = moves;
                console.timeEnd('Updating moves');
                console.log('%cmoves:', LOG.state, this.moves.length);
            }
        },
        'result': {
            get: function() {
                console.log('%cChecking result. Legal moves:', LOG.action, this.moves.length);
            //  Game results: 2bit integer [0..3]
            //  result = <checkmate flag>|<color flag>
            //  0         00         Not over
            //  1         01         Draw
            //  2         10         White wins
            //  3         11         Black win
                if (this.moves.length) {
                    return 0;
                }
                if (this.checks.length) {
                    return 2|+!this.activeColor; 
                } 
                return 1;
            }
        },
        'update': {
            value: function(move) {
                console.assert(_move.isPrototypeOf(move), 'Invalid move.', move);
            //  Update position object to represent changes after given move.
            //  Use the following order to update properties:
            //
            //  Core properties
            //  1.  Update `pieces` and piece object `square` properties
            //  2.  Update `activeColor`
            //  3.  Update `castleRights`
            //  4.  Update `enpassantAt`
            //  5.  Update `halfMoveClock`
            //  6.  Update `fullMoveCount`
            //
            //  Derived properties
            //  7.  Update `pieceList`
            //  8.  Update piece object `attacks` properties
            //  9.  Update `attacked`
            //  10. Update `checks`
            //  11. Update `pins`
            //  12. Update `moves`
            //
                var from = move.from,
                    to = move.to,
                    special = move.special,
                    color = move.color,
                    enemy = +!color;

            //  Update pieces & squares
            //  Move piece to target square (occupying piece is lost). Empty initial square.
            //  Also update `square` property of affected pieces, so that it matches new square.
                this.pieces[to] = this.pieces[from];
                this.pieces[to].square = to;
                this.pieces[from] = null;
                if (special) {
                    if (special === MOVE_SPECIAL.castles[0]) {
                    //  Kingside castle. Move the rook.
                        this.pieces[CASTLE_ROOKS[color][0].to] = this.pieces[CASTLE_ROOKS[color][0].from];
                        this.pieces[CASTLE_ROOKS[color][0].to].square = CASTLE_ROOKS[color][0].to;
                        this.pieces[CASTLE_ROOKS[color][0].from] = null;
                    } else if (special === MOVE_SPECIAL.castles[1]) {
                    //  Queenside castle. Move the rook.
                        this.pieces[CASTLE_ROOKS[color][1].to] = this.pieces[CASTLE_ROOKS[color][1].from];
                        this.pieces[CASTLE_ROOKS[color][1].to].square = CASTLE_ROOKS[color][1].to;
                        this.pieces[CASTLE_ROOKS[color][1].from] = null;    
                    } else if (special === MOVE_SPECIAL.enpassant) {
                    //  Enpassant. Om-nom-nom
                        this.pieces[ENPASSANT_TARGET[to]] = null;
                    } else if (move.isPromote) {
                    //  A pawn has promoted. Delete it and create new piece in its place.
                        console.log('%cPromoting piece...', LOG.action, move.promote, move.promote.pieceType);
                        delete this.pieces[to];
                        this.pieces[to] = createPiece(move.promote, to);
                        console.log('%cNew piece:', LOG.state, this.pieces[to]);
                    }
                }

            //  Update active color
                this.activeColor = enemy;

            //  Update castle rights
            //  If castle is already illegal, there is no need to update.
            //  Own castle rights can be lost, when king or rook moves.
            //  Enemy castle can be disabled, when capturing a rook.
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

            //  Update enpassant
                if (move.isDouble) {
                    this.enpassantAt = (from + to) / 2;
                } else {
                    this.enpassantAt = null;
                }
                console.log('%cenpassantAt', LOG.state, this.enpassantAt);

            //  Update halfmove clock
                if ((move.isQuiet) && (move.piece.pieceType !== PAWN)) {
                    this.halfMoveClock += 1;
                } else {
                    this.halfMoveClock = 0;
                }

            //  Update fullmove count
                this.fullMoveCount += (color === WHITE) ? 0 : 1;

            //  Update derived position properties:
                this.updatePieceList(move);
                this.updatePieceAttacks(move);
                this.setAttacked();
                this.setChecks();
                this.setPins();
                this.setMoves();
            }
        },
        'yields': {
            value: function(move) {
                var position = createPosition(this.fen);
                position.update(move);
                return position;
            }
        }
    });

    _pieceList = {};
    Object.defineProperties(_pieceList, {
        0:             { value: [], writable: true, enumerable: true, configurable: true }, // Array containing white pieces.
        1:             { value: [], writable: true, enumerable: true, configurable: true }, // Array containing black pieces.
        'pawns': {
        //  Returns array of pawns matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'pawn';
                });
            }
        },
        'knights': {
        //  Returns array of knights matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'knight';
                });
            }
        },
        'bishops': {
        //  Returns array of bishops matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'bishop';
                });
            }
        },
        'rooks': {
        //  Returns array of rooks matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'rook';
                });
            }
        },
        'queens': {
        //  Returns array of queens matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'queen';
                });
            }
        },
        'kings': {
        //  Returns array of kings matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) { 
                    return piece.name === 'king';
                });
            }
        },
        'pinned': {
        //  Returns array of pinned pieces matching given color.
            value: function(color) {
                return this[+!!color].filter(function(piece) {
                    return !!piece.pin;
                });
            }
        },
        'all': {
        //  Return array with all pieces on the board.
            get: function() {
                return this[0].concat(this[1]);
            } 
        }
    });

    function createPieceList(position) {
    //  Piece list factory function.
    //  Create and return pieceList object representing all pieces currently in play
    //  (together with accompanying accessor methods).
        var list;
        function PieceList() {};
        PieceList.prototype = _pieceList;
        list = new PieceList();

        list[0] = [];
        list[1] = [];
    //  Populate list to match position.
        SQUARES.forEach(function(square) {
            var piece = position.pieces[square];
            if (piece) {
                list[piece.color].push(piece);
            }
        });

        return list;
    }

    _pinList = {};
    Object.defineProperties(_pinList, {
        0:             { writable: true, enumerable: true, configurable: true }, // Array containing white pieces under pin.
        1:             { writable: true, enumerable: true, configurable: true }, // Array containing black pieces under pin.
        'all': {
            get: function() {
            //  Returns array of all pins.
                return this[0].concat(this[1]);
            }
        }
    });

    function createPinList() {
    //  Pin list factory function.
        var list;
        function PinList() {};
        PinList.prototype = _pinList;
        list = new PinList();

        list[0] = [];
        list[1] = [];

        return list;
    }

//  validFen :: RegEx
//  Create regular expression for validating FEN strings.    
    validFen = /^([pnbrqkPNBRQK1-8\/]){17,71} ([wb]){1} ([kqKQ\-]){1,4} ([a-h36\-]){1,2} (\d){1,2} (\d){1,3}$/;
    rules.validFen = validFen;

//  position :: function()
//  Factory function, returns position object based on given FEN string.
    function createPosition(fen) {
        console.assert(fen.match(validFen), 'Invalid FEN notation.');

        var position;
        function Position() {};
        Position.prototype = _position;
        position = new Position();

        position.fen = fen;
    //  Create list objects.
        position.setPieceList();
        position.setPinList();
    //  Update objects.
        position.setPieceAttacks();
        position.setAttacked();
        position.setChecks();
        position.setPins();
        position.setMoves();

        return position;
    }
    rules.createPosition = createPosition;

//  ** CHECK REPRESENTATION
//  -----------------------------------------------------
//  Information about a check is stored in a simple Check object.
//  Each check stores the following properties:
//  'ray':              Full ray of checked squares, starting from the square 
//                      adjecent to the king and up to (including) the source.
//  'source':           (getter method) Location of the attacking piece.
//  'signature':         
//  'isDirect':         (getter method) Only capture moves allowed?
//
//  If the check is single, it can be defended by any piece stepping into
//  checking ray (which includes capturing source of the check).
//  In the case of a double check, though, only king moves are legal.
//
    _check = {};
    Object.defineProperties(_check, {
        'ray':             { writable: true, configurable: true },
        'source':         { get: function() { return this.ray[this.ray.length - 1]; } },
        'signature':     { get: function() { return signature(this.ray); } },
        'isDirect':     { get: function() { return this.ray.length === 1; } }
    });

    function createCheck(ray) {
        console.assert(ray.isRay(), 'Invalid checking ray.');
    //  Check factory function.
        var check;
        function Check() {};
        Check.prototype = _check;

        check = new Check();
        check.ray = ray;
        Object.freeze(check);

        console.log('%cCreating new check...', LOG.action, check);
        return check;
    }

//  ** PIN REPRESENTATION
//  -----------------------------------------------------
//  Information about a pin is stored in a Pin object, similarly to check.
//  'ray':              Pinning ray, starting from square adjecent to the king
//                      and ending on the pinning piece (pin source).
//  'source':           (getter) Square under the pinning piece.
//  'singature':        (getter) Module of ray versor (pin direction).
//
    _pin = {};
    Object.defineProperties(_pin, {
        'ray':             { writable: true, configurable: true },
        'source':         { get: function() { return this.ray[this.ray.length - 1]; } },        
        'signature':     { get: function() { return signature(this.ray); } }
    });

    function createPin(ray) {
        console.assert(ray.isRay() && square.onBoard, 'Invalid pin.');
    //  Pin factory function.
        var pin;
        function Pin() {};
        Pin.prototype = _pin;

        pin = new Pin();
        pin.ray = ray;
        Object.freeze(pin);

        console.log('%cCreating new pin...', LOG.action, pin);
        return pin;
    }

//  ** PIECE REPRESENTATION
//  -----------------------------------------------------
//  Chess pieces have two types of representation:
//  A. Integer (stores information about piece type and color)
//  B. Piece Object (mutable object, stores all kinds of properties)
//
//  * Piece Integer Mask (code)
//  piece == color[2bit] | type[3bit]
//  -----------------------------------------------------
//  Colors:                         Types:
//  0   00___   (None)              0   __000   (None)
//  16  10___   White               1   __001   Pawn
//  24  11___   Black               2   __010   Knight
//                                  3   __011   King
//                                  5   __101   Bishop
//                                  6   __110   Rook
//                                  7   __111   Queen
//  -----------------------------------------------------
//  0   00000   (None)
//  17  10001   W Pawn              25  11001   B Pawn
//  18  10010   W Knight            26  11010   B Knight
//  19  10011   W King              27  11011   B King
//  21  10101   W Bishop            29  11101   B Bishop
//  22  10110   W Rook              30  11110   B Rook
//  23  10111   W Queen             31  11111   B Queen
//
//  * Piece Object Representation
//  Piece Object stores four properties, as well as additional
//  accessor properties and methods inherited from its prototype
//  object. Each piece type has its own prototype.
//  -----------------------------------------------------
//  piece = {
//      code: <piece int mask>,
//      square: <square index>,
//      attacks: Array[] of attacked squares,
//      moves: Array[] of legal moves 
//  }
//
//  Important note (promoting pawns):
//  Promoted pawn objects don't get their 'code' switched to new piece code.
//  Instead, a new instance of Piece is created on the promotion square.
//  In general, 'code' property of a piece is meant to be immutable, whereas
//  'square', 'attacks' and 'moves' are updated every time position changes.
    console.log('%cDefining pieces...', LOG.action);

//  Piece prototype.
    _piece = {};
    Object.defineProperties(_piece, {
        'code':             { writable: true, configurable: true },
        'square':           { writable: true, configurable: true },
        'attacks':          { writable: true, configurable: true },
        'moves':            { writable: true, configurable: true },
        'color':            { get: function() { return this.code.pieceColor; } },
        'type':             { get: function() { return this.code.pieceType; } },
        'isRanged':         { get: function() { return !!(this.code & 4); } },
        'isLight':          { get: function() { return (this.type === KNIGHT) || (this.type === BISHOP); } },
        'isHeavy':          { get: function() { return (this.type === ROOK) || (this.type === QUEEN); } }
    });

    _pawn = Object.create(_piece);
    Object.defineProperties(_pawn, {
        'pin':              { writable: true, configurable: true },        
        'name':             { get: function() { return "pawn" } },
        'range':            { get: function() { return 1; } },
        'points':           { get: function() { return 100; } },
        'attackVectors':    { get: function() { return (this.color) ? [-17,-15] : [15,17]; } },
        'passiveVectors':   { get: function() { return (this.color) ? [-16] : [16]; } }
    });
    Object.defineProperty(_pawn, 'updateAttacks', {
        value: function updatePawnAttacks() {
            this.attacks = this.attackVectors.shiftSquares(this.square);
        }
    });
    Object.defineProperty(_pawn, 'updateMoves', {
        value: function updatePawnMoves(position) {        
            var from = this.square,    to, special, squaresTo, promote,
                checkCount = position.checks.length, moves = [];
        //  March forawrd!
        //  Account for pins and checks.
        //  Look out for promotions.
            promote = (from.rank === SEVENTH_RANK_INDEX[this.color]) ? (MOVE_SPECIAL_MASK.promote|MOVE_SPECIAL_MASK.queen) : 0;

            squaresTo = _.flatten(PASSIVE_RAYS[from][this.code]);
            if (checkCount) {
                if (checkCount > 1) {
                    squaresTo = [];
                } else {
                //  Single check. Pawn can shield the king (maybe).
                    squaresTo = _.intersection(squaresTo, position.checks[0].ray);
                //  With double move check if shielding the king doesn't require the pawn
                //  to pass through an occupied square. In that case, disallow the move.
                    if (squaresTo.length && (dist(from, squaresTo[0]) === 2)) {
                        if (position.pieces[from + this.passiveVectors[0]]) {     
                        //  Pawn movement blocked. (+passiveVectors[0]: one square forward)
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
                //  Obstacle on the way. Can go no further.
                    break;
                }
                special = (i > 0) ? MOVE_SPECIAL.double : (0|promote);
                moves.push(createMove(position, from, to, special));
            }
        //  Pawn captures.
            squaresTo = this.attacks;
            if (checkCount) {
                if (checkCount > 1) {
                    squaresTo = [];
                } else {
                //  Single check. Pawn can only capture the source of check.
                    squaresTo = _.intersection(squaresTo, [position.checks[0].source]);
                }
            }
            if ((squaresTo.length > 0) && this.pin) {
                squaresTo = _.intersection(squaresTo, this.pin.ray);
            }
            for (var i = 0; i < squaresTo.length; i++) {
                to = squaresTo[i];
                if (position.pieces[to] && (position.pieces[to].color !== this.color)) {
                //  Enemy in capture range. Go for the eyes, Boo!
                    moves.push(createMove(position, from, to, 4|promote));
                } else if (position.enpassantAt === to) {
                //  Enpassant capture possible. Now quickly!
                    moves.push(createMove(position, from, to, 5));
                }
            }
            this.moves = moves;
        }        
    });

    _knight = Object.create(_piece);
    Object.defineProperties(_knight, {
        'pin':              { writable: true, configurable: true },
        'name':             { get: function() { return "knight" } },
        'range':            { get: function() { return 1; } },
        'points':           { get: function() { return 310; } },
        'attackVectors':    { get: function() { return [-33,-31,-18,-14,14,18,31,33]; } }
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
        //  Pinned knight can't move.
        //  Under check knight can only move to checking ray.
        //  Other than that, moves to any unoccupied or hostlie squares allowed.
            if (!this.pin) {
                squaresTo = this.attacks;
                if (checkCount) {
                    if (checkCount === 1) {
                    //  Single check. Knight can intercept attack.
                        squaresTo = _.intersection(squaresTo, position.checks[0].ray);
                    } else {
                    //  Double check. Jumping is futile.
                        squaresTo = [];
                    }                    
                }
                for (var square in squaresTo) {
                    to = squaresTo[square];
                    if (!position.pieces[to]) {
                        moves.push(createMove(position, from, to, 0))
                    } else if (position.pieces[to].color !== this.color) {
                        moves.push(createMove(position, from, to, 4));
                    }
                }
            }
            this.moves = moves;
        }        
    });

    _bishop = Object.create(_piece);
    Object.defineProperties(_bishop, {
        'pin':              { writable: true, configurable: true },
        'name':             { get: function() { return "bishop" } },
        'range':            { get: function() { return 7; } },
        'points':           { get: function() { return 320; } },
        'attackVectors':    { get: function() { return [-17,-15,15,17]; } },
        'complex':          { get: function() { return this.square.complex; } }
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
                    //  Ranged attacks end at the first occupied square.
                    //  One exception is the enemy king, which counts as 'invisible'
                    //  for the purpose of calculating attacked squares.
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
                    moves.push(createMove(position, from, to, 0));
                } else if (position.pieces[to].color !== this.color) {
                    moves.push(createMove(position, from, to, 4));
                }
            }
            this.moves = moves;
        }        
    });

    _rook = Object.create(_piece);
    Object.defineProperties(_rook, {
        'pin':              { writable: true, configurable: true },
        'name':             { get: function() { return "rook" } },
        'range':            { get: function() { return 7; } },
        'points':           { get: function() { return 480; } },
        'attackVectors':    { get: function() { return [-16,-1,1,16]; } }
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
                    //  Ranged attacks end at the first occupied square.
                    //  One exception is the enemy king, which counts as 'invisible'
                    //  for the purpose of calculating attacked squares.
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
                    moves.push(createMove(position, from, to, 0));
                } else if (position.pieces[to].color !== this.color) {
                    moves.push(createMove(position, from, to, 4));
                }
            }
            this.moves = moves;
        }        
    });

    _queen = Object.create(_piece);
    Object.defineProperties(_queen, {
        'pin':              { writable: true, configurable: true },
        'name':             { get: function() { return "queen" } },
        'range':            { get: function() { return 7; } },
        'points':           { get: function() { return 920; } },
        'attackVectors':    { get: function() { return [-17,-16,-15,-1,1,15,16,17]; } }
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
                    //  Ranged attacks end at the first occupied square.
                    //  One exception is the enemy king, which counts as 'invisible'
                    //  for the purpose of calculating attacked squares.
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
                    moves.push(createMove(position, from, to, 0));
                } else if (position.pieces[to].color !== this.color) {
                    moves.push(createMove(position, from, to, 4));
                }
            }
            this.moves = moves;
        }        
    });

    _king = Object.create(_piece);
    Object.defineProperties(_king, {
        'checks':           { writable: true, configurable: true },
        'name':             { get: function() { return "king" } },
        'range':            { get: function() { return 1; } },
        'points':           { get: function() { return 10000; } },
        'attackVectors':    { get: function() { return [-17,-16,-15,-1,1,15,16,17]; } },
        'passiveVectors':   { get: function() { return [-1,1]; } }
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

        //  King can move to any square not attacked by the enemy.
            squaresTo = this.attacks.filter(function(square) {
                return !position.attacked[square][enemy].length;
            });
            for (var square in squaresTo) {
                to = squaresTo[square];
                if (!position.pieces[to]) {
                    moves.push(createMove(position, from, to, 0));
                } else if (position.pieces[to].color !== this.color) {
                    moves.push(createMove(position, from, to, 4));
                }
            }
        //  Castling.
            if (position.castleRights[this.color] && !checkCount) {
            //  King still has some castling rights and is not under check.
                for (var side = 0; side < 2; side++) {
                //  Castling rights (2bit integer)[0..3] is a combination of flags:
                //  1:  01      castle kingside
                //  2:  10      castle queenside 
                    if (position.castleRights[this.color] & (side + 1)) {
                    //  Can castle on this side.
                    //  Check if required squares are empty and not attacked.
                        if (PASSIVE_RAYS[from][this.code][side].every(function(square) {
                            return !(position.pieces[square] || position.attacked[square][enemy].length);
                        })) {
                            if (side === 0) {
                            //  Short castle legal.
                                to = CASTLE_KING_TO[this.color][0];
                                moves.push(createMove(position, from, to, 2));    
                            } else {
                            //  Long castle. Check if the rook is not blocked on 'b' file.
                                if (!position.pieces[this.square - 3]) {
                                    to = CASTLE_KING_TO[this.color][1];
                                    moves.push(createMove(position, from, to, 3));
                                }    
                            }
                        }
    
                    }
                }    
            }
            this.moves = moves;
        }        
    });

//  createPiece :: function()
//  Factory function, returns piece object based on piece code and square.
    function createPiece(code, square) {
        console.assert(code.pieceType, 'Invalid piece code.');
        console.assert(square.onBoard, 'Invalid square index.');
    //  Property            Description                 Method                 Description
    //  --------------------------------------------------------------------------------------------------
    //  code                 
    //  square                 
    //  attacks                                         updateAttacks
    //  moves                                           updateMoves
    //  color               getter
    //  type                getter
    //  isRanged            getter
    //  range               getter
    //  name                getter
    //  points              getter
    //  attackVectors       getter
    //  *passiveVectors     getter (P,K)
    //  *pin                getter (P,N,B,R,Q)
    //  *checks             getter (K)
    //
        var piece;
        function Piece() {};
        switch (code.pieceType) {
            case 1:         Piece.prototype = _pawn; break;
            case 2:         Piece.prototype = _knight; break;
            case 3:         Piece.prototype = _king; break;
            case 5:         Piece.prototype = _bishop; break;
            case 6:         Piece.prototype = _rook; break;
            case 7:         Piece.prototype = _queen; break;
            default:        throw new Error('Unknown piece type.');
        }

        piece = new Piece();
        piece.code = code;
        piece.square = square;

        return piece;
    }

//  ** MOVE REPRESENTATION
//  -----------------------------------------------------
//  Chess moves must specify starting and destination squares.
//  Castling, enpassant captures and promotions must be distinguished.
//  It's also convenient to store some additional details about the move
//  1.  From square
//  2.  To square
//  3.  Piece being moved
//  4.  (Piece captured)
//  5.  Special values:
//      - capture       - promote        - castle
//      - enpassant     - pawn double
//
//  Special     Move            Mask Composition
//  -----------------------------------------------------
//  0           Quiet
//  1           Double          double
//  2           O-O-O           castle|long
//  3           O-O             castle|short
//  4           Capture         capture
//  5           Enpassant       capture|enpassant
//    
//  8           Promote=N       promote|knight
//  9           Promote=B       promote|bishop
//  10          Promote=R       promote|rook
//  11          Promote=Q       promote|queen    
//  12          Capture=N       promote|capture|knight
//  13          Capture=B       promote|capture|bishop
//  14          Capture=R       promote|capture|rook
//  15          Capture=Q       promote|capture|queen            
//
//  Mask Values
//  -----------------------------------------------------
//  double      1               promote     8
//  castle      2               knight      0
//  long        0               bishop      1
//  short       1               rook        2
//                              queen       3
//  capture     4
//  enpassant   1
//
    console.log('%cDefining moves...', LOG.action);

    MOVE_SPECIAL_MASK = {
        'double': 1,
        'castle': 2,        // *Not used (access via .castles[i])
        'long': 0,          // *Not used
        'short': 1,         // *Not used
        'capture': 4,
        'enpassant': 1,     // *Not used
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
    MOVE_SPECIAL_VALUES = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15];

    _move = {};
    Object.defineProperties(_move, {
        'from':         { writable: true, enumerable: true, configurable: true },
        'to':           { writable: true, enumerable: true, configurable: true },
        'special':      { writable: true, enumerable: true, configurable: true },
        'piece':        { writable: true, enumerable: true, configurable: true },
        'origin':       { value: '', writable: true, enumerable: true, configurable: true },        
        'type':         { get: function() { return this.piece.pieceType; } },
        'color':        { get: function() { return this.piece.pieceColor; } },
        'isCapture':    { get: function() { return !!(this.special & MOVE_SPECIAL_MASK.capture); } },
        'isPromote':    { get: function() { return !!(this.special & MOVE_SPECIAL_MASK.promote); } },
        'isCastle':     { get: function() { return _.contains(MOVE_SPECIAL.castles, this.special); } },
        'isEnpassant':  { get: function() { return !!(this.special === MOVE_SPECIAL.enpassant); } },
        'isDouble':     { get: function() { return this.special === MOVE_SPECIAL.double; } },
        'isQuiet':      { get: function() { return !this.special; } },
        'san': { 
            get: function() {
            //  SAN: Standart Algebraic Notation.
            //  [piece symbol][*disambiguation][*capture][to square][*promote to][**check(mate)]
            //  Castle: O-O, O-O-O
                var notation;
                if (this.isCastle) {
                    notation = (this.castle === 0) ? 'O-O-O' : 'O-O';
                    return notation;
                }
            //  Piece symbol
                notation = PIECE_TYPE_NOTATION[this.type];
            //  Disambiguation
                notation += this.origin;
            //  Capture
                if (this.isCapture) {
                    if (this.type === PAWN) {
                    //  Pawn capture disambiguation.
                        notation += FILE_NAMES[this.from.file];
                    }
                    notation += 'x';
                }
            //  Destination square
                notation += SQUARE_NAME[this.to];
            //  Promote
                if (this.isPromote) {
                    notation += '=' + PIECE_TYPE_NOTATION[this.promote.pieceType];
                }
            //  Check / Checkmate
            //  Requires position scan. Handled elsewhere.
            //
                return notation;
            } 
        },
        'value': {
            get: function() {
            //  Move values allow for quick pre-sorting of moves, before doing
            //  full evaluation. High value moves are evaluated first, the ones
            //  with especially low values may get ignored (as, with large
            //  probability, not worth analyzing). (Game tree pruning)
                var value = 0;
                if (this.isPromote) {
                    value += 8;
                }
                if (this.isCapture) {
                    switch (this.captured.pieceType) {
                    //  The more valueable captured piece the better.
                        case PAWN:          value += 1; break;
                        case KNIGHT:        value += 3; break;
                        case BISHOP:        value += 3; break;
                        case ROOK:          value += 5; break;
                        case QUEEN:         value += 9; break;
                        default:            throw new Error('King capture!');
                    }
                    switch (this.type) {
                    //  Less valuable attackers are better.
                        case PAWN:          break;
                        case KNIGHT:        value *= 0.75; break;
                        case BISHOP:        value *= 0.75; break;
                        case ROOK:          value *= 0.5; break;
                        case QUEEN:         value *= 0.3; break;
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

    function createMove(position, from, to, special) {
        console.assert(_position.isPrototypeOf(position), 'Invalid position.', position);
        console.assert(from.onBoard && to.onBoard, 'Invalid from/to square index.');
        console.assert(_.contains(MOVE_SPECIAL_VALUES, special)), 'Invalid special value.', special);
    //  Move factory function.
    //  position: current position object
    //  from, to: (int)[0..119]
    //  special: move special value
    // 
        var move, enemy;
        function Move() {};
        Move.prototype = _move;
        move = new Move();

        move.from = from;
        move.to = to;
        move.special = special;
        move.piece = position.pieces[from].code;
        enemy = move.color ? W : B;

    //  Set additional properties, if applicable.    
        if (move.isQuiet || move.isDouble) {
            return move;
        }
        if (move.isCapture) {
            move.captured = (move.isEnpassant) ? (enemy|PAWN) : position.pieces[to].code;
        }
        if (move.isCastle) {
            move.castle = special % 2;
            return move;
        }
        if (move.isPromote) {
            move.promoteTo = move.color ? B : W;
            move.promoteTo |= (function() {
                switch (special % 4) {
                    case MOVE_SPECIAL_MASK.knight: return KNIGHT;
                    case MOVE_SPECIAL_MASK.bishop: return BISHOP;
                    case MOVE_SPECIAL_MASK.rook: return ROOK;
                    default: return QUEEN;
                }
            }());
        }
        return move;
    }

    function opposite(color) {
        console.assert((color === 0) || (color === 1), 'Invalid color.', color);
    //  Returns opposite color value (0: white, 1: black).
        return +(!color);
    }
    rules.opposite = opposite;

    function dist(x, y) {
        console.assert(x.onBoard && y.onBoard, 'Invalid square coordinates.');
    //  Defines chessboard metric (max or "taxi" metric).
    //  Returns distance between two squares.
        return Math.max(Math.abs(x.rank - y.rank), Math.abs(x.file - y.file));
    }

    function signature(ray) {
        console.assert(ray.isRay() && (ray.length > 1), 'Invalid ray.', ray);
    //  Computes signature of a ray. Signature is a (positive) versor, which
    //  represents direction of the ray. Important values:
    //  1   Horizontal              15  TopLeft-BottomRight diagonal
    //  16  Vertical                17  TopRight-BottomLeft diagonal
        return Math.abs(ray[1] - ray[0]);
    }

    function proximity(target, distance) {
        console.assert(target.onBoard && (typeof distance === 'number'), 'Invalid proximity arguments.');
    //  Return array of squares in proximity of target square.
    //  All squares within a certain range are returned.
    //  (Note: target square itself is not included)
        var proximity = _.without(SQUARES, target).filter(function(square) {
            return dist(square, target) <= distance;
        });
        return proximity;
    }
    rules.proximity = proximity;

    function disambiguate(moves) {
        console.assert(_.isArray(moves) && (moves.length > 1), 'Invalid moves array.');
    //  Assign unique origin tokens to each element in a set of ambiguous moves.
    //  For example, two Knights with possible moves to 'f3' square, would share 'Nf3' notation.
    //  Disambiguation would change their notations to 'Ndf3' and 'Ngf3'.
    //
    //  moves:     Array[2+] of move objects.
    //  (function directly modifies referenced objects)
        var move;

        if (moves.length > 2) {
        //  For three or more pieces with the same destination, notation tokens take form
        //  of origin square name ('e4').
            for (var i = 0; i < moves.length; i++) {
                move = moves[i];
                move.origin = SQUARE_NAME[move.from]; 
            }
        } else {
        //  For two pieces sharing move destination, try to distinguish them by file ('e').
        //  If both occupy the same file, distinguish by rank ('4').
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
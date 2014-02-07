describe('Rules service:', function() {
//  Disable logging for this test suite.
    if (window.console) {
        var console = {};
        console.log = function() {};
        console.debug = function() {};
        console.assert = function() {};
        console.time = function() {};
        console.timeEnd = function() {};
        window.console = console;
    }

//  Test standard chess starting position.
    describe('starting position', function() {
        var $rules, position,
            fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        beforeEach(function() {
            module('app');
            inject(function(rules) {
                $rules = rules;
            });
            position = $rules.createPosition(fen);
        });

        it('should load', function() {
            expect(position).toBeDefined();
            expect(_.size(position.pieces)).toEqual(64);
        });
        it('should have correct pieces', function() {
            expect(position.pieceList.all.length).toEqual(32);
            expect(position.pieceList[0].length).toEqual(16);
            expect(position.pieceList[1].length).toEqual(16);
        });
        it('should have white active', function() {
            expect(position.activeColor).toBe(0);
        });
        it('should have full castling rights', function() {
            expect(position.castleRights[0]).toBe(3);
            expect(position.castleRights[1]).toBe(3);
        });
        it('should have no enpassant targets', function() {
            expect(position.enpassantAt).toBeNull();
        });
        it('should have correct halfmove clock', function() {
            expect(position.halfMoveClock).toBe(0);
        });
        it('should have correct fullmove count', function() {
            expect(position.fullMoveCount).toBe(1);
        });
        it('should have no checks', function() {
            expect(position.checks.length).toBe(0);
        });
        it('should have no pins', function() {
            expect(position.pinList[0].length).toBe(0);
            expect(position.pinList[1].length).toBe(0);
        });
        it('should have correct moves', function() {
            expect(position.moves.length).toBe(20);
        });
        it('should return correct FEN', function() {
            expect(position.fen).toEqual(fen);
        });
    });

//  Endgame study position from Richard Reti, 1920 (White to play and draw).
//  With only 4 pieces on the board examine objects in full detail.
    describe('position "Reti, 1920"', function() {
        var $rules, position,
            fen = "7K/8/k1P5/7p/8/8/8/8 w - - 0 0";

        beforeEach(function() {
            module('app');
            inject(function(rules) {
                $rules = rules;
            });
            position = $rules.createPosition(fen);
        });

        it('should load', function() {
            expect(position).toBeDefined();
            expect(_.size(position.pieces)).toEqual(64);
        });
        it('should have correct pieces', function() {
            $rules.SQUARES.forEach(function(square) {
                switch (square) {
                    case 71: expect(position.pieces[square].code).toEqual(25); break; // Black pawn on h5 
                    case 80: expect(position.pieces[square].code).toEqual(27); break; // Black king on a6
                    case 82: expect(position.pieces[square].code).toEqual(17); break; // White pawn on c6
                    case 119: expect(position.pieces[square].code).toEqual(19); break; // White king on h8
                    default: expect(position.pieces[square]).toBeNull(); break; // Empty squares
                }
            });
            expect(position.pieceList.all.length).toBe(4);
            expect(position.pieceList[0].length).toBe(2);
            expect(position.pieceList[1].length).toBe(2);
            expect(position.pieceList.pawns(0).length).toBe(1);
            expect(position.pieceList.kings(0).length).toBe(1);
            expect(position.pieceList.pawns(1).length).toBe(1);
            expect(position.pieceList.kings(1).length).toBe(1);
        });
        it('should have white active', function() {
            expect(position.activeColor).toBe(0);
        });
        it('should have no castling rights', function() {
            expect(position.castleRights[0]).toBe(0);
            expect(position.castleRights[1]).toBe(0);
        });
        it('should have no enpassant targets', function() {
            expect(position.enpassantAt).toBeNull();
        });
        it('should have correct halfmove clock', function() {
            expect(position.halfMoveClock).toBe(0);
        });
        it('should have correct fullmove count', function() {
            expect(position.fullMoveCount).toBe(0);
        });
        it('should have correct attacks', function() {
            $rules.SQUARES.forEach(function(square) {
                switch (square) {
                    case 97: case 99: expect(position.attacked[square][0]).toContain(1); break; // White pawn attacks
                    case 102: case 103: case 118: expect(position.attacked[square][0]).toContain(3); break; // White king
                    default: expect(position.attacked[square][0].length).toBe(0); // Not attacked by white
                }
                switch (square) {
                    case 54: expect(position.attacked[square][1]).toContain(1); break; // Black pawn attacks
                    case 64: case 65: case 81: case 96: case 97: expect(position.attacked[square][1]).toContain(3); break; // Black king
                    default: expect(position.attacked[square][1].length).toBe(0); // Not attacked by black
                }
            });
        });
        it('should have no checks', function() {
            expect(position.checks.length).toBe(0);
        });
        it('should have no pins', function() {
            expect(position.pinList[0].length).toBe(0);
            expect(position.pinList[1].length).toBe(0);
        });
        it('should have correct moves', function() {
            expect(position.moves.length).toBe(4);
        });
    });

});
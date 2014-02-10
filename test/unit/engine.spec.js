describe('ENGINE:', function() {
//  Disable logging for this test suite.
/*
    if (window.console) {
        var console = {};
        console.log = function() {};
        console.debug = function() {};
        console.assert = function() {};
        console.time = function() {};
        console.timeEnd = function() {};
        window.console = console;
    }
*/

//  Test exchange evaluation.
//  -------------------------
    describe('exchange evaluation', function() {
        var $rules, $engine;

        beforeEach(function() {
            module('app');
            inject(function(rules) {
                $rules = rules;
            });
            inject(function(engine) {
                $engine = engine;
            });
        });

        it('should be defined', function() {
            expect($engine).toBeDefined();
            expect(typeof $engine.evaluateExchange).toEqual('function');
        });
        it('should return undefined on nonsense input', function() {
            expect($engine.evaluateExchange()).toBeUndefined();
            expect($engine.evaluateExchange({
                'piece': 'of cake', 
                'attackers': ['Guybrush', 'Threepwood'],
                'defenders': ['Doctor', 'Who']
            })).toBeUndefined();
        });

    //  SCENARIO #0: pawn captures a pawn
    //  Result: material gain.
    //  . . . . . . . .     P - black pawn
    //  . . . . . . . .     p - white pawn
    //  . .-P-. . . . .     -X- square of exchange
    //  . p . . . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: []
    //  . . . . . . . .     EXPECT: +
    //
        it('(SCENARIO #0) should return +', function() {
            var exchange = {
                target: 1,
                attackers: [1],
                defenders: []
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    //  SCENARIO #1: pawn exchange
    //  Result: white captures pawn, black recaptures pawn, no changes.
    //  . . . . . . . .     P - black pawns
    //  . P . . . . . .     p - white pawns
    //  . .-P-. . . . .     -X- square of exchange
    //  . p . . . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .     EXPECT: 0
    //
        it('(SCENARIO #1) should return 0', function() {
            var exchange = {
                target: 1,
                attackers: [1],
                defenders: [1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  SCENARIO #2: two attacking pawns, one defender
    //  Result: attacker captures both pawns, loses one, gains material. 
    //  . . . . . . . .
    //  . P . . . . . .
    //  . .-P-. . . . .
    //  . p . p . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1, 1]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .     EXPECT: +
    //
        it('(SCENARIO #2) should return +', function() {
            var exchange = {
                target: 1,
                attackers: [1, 1],
                defenders: [1]
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    //  SCENARIO #3: one attacking pawn, two defenders
    //  Result: one pair of pawns gets exchanged, no changes.
    //  . . . . . . . .
    //  . P . P . . . .
    //  . .-P-. . . . .
    //  . . . p . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: [1, 1]
    //  . . . . . . . .     EXPECT: 0
    //
        it('(SCENARIO #3) should return 0', function() {
            var exchange = {
                target: 1,
                attackers: [1],
                defenders: [1, 1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  SCENARIO #4: two attacking pawns, two defenders
    //  Result: Two pawns of each color get captured, no change. 
    //  . . . . . . . .
    //  . P . P . . . .
    //  . .-P-. . . . .
    //  . p . p . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1, 1]
    //  . . . . . . . .     defenders: [1, 1]
    //  . . . . . . . .     EXPECT: 0
    //
        it('(SCENARIO #4) should return 0', function() {
            var exchange = {
                target: 1,
                attackers: [1, 1],
                defenders: [1, 1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  SCENARIO #5: king attacks a pawn, king defends
    //  Result: Capture is illegal for the king.
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . K . . .
    //  . . . .-P-. . .     target: 1
    //  . . . . k . . .     attackers: [3]
    //  . . . . . . . .     defenders: [3]
    //  . . . . . . . .     EXPECT: 0
    //
        it('(SCENARIO #4) should return 0', function() {
            var exchange = {
                target: 1,
                attackers: [3],
                defenders: [3]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  SCENARIO #6: king  and pawn attack pawn, king defends
    //  Result: Pawn captures, black can't recapture.
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . K . . .
    //  . . . .-P-. . .     target: 1
    //  . . . p k . . .     attackers: [1, 3]
    //  . . . . . . . .     defenders: [3]
    //  . . . . . . . .     EXPECT: +
    //
        it('(SCENARIO #6) should return +', function() {
            var exchange = {
                target: 1,
                attackers: [3, 1],
                defenders: [3]
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    //  SCENARIO #7: Queen captures protected rook
    //  Result: Loses queen, gains rook, not worth it.
    //  . . . . R . . .
    //  . . . . . . . .
    //  . . . .-R-. . .
    //  . . . . . . . .
    //  . . q . . . . .     target: 6
    //  . . . . . . . .     attackers: [7]
    //  . . . . . . . .     defenders: [6]
    //  . . . . . . . .     EXPECT: -
    //
        it('(SCENARIO #7) should return -', function() {
            var exchange = {
                target: 6,
                attackers: [7],
                defenders: [6]
            };
            expect($engine.evaluateExchange(exchange)).toBeLessThan(0);
        });

    //  SCENARIO #8: Rook and king attack bishop defended by pawn
    //  Result: Captures bishop + pawn, loses rook, not worth it.
    //  . . . . . . . .
    //  . . . . . P . .
    //  r . . .-B-. . .
    //  . . . . k . . .
    //  . . . . . . . .     target: 5
    //  . . . . . . . .     attackers: [3, 6]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .     EXPECT: -
    //
        it('(SCENARIO #8) should return -', function() {
            var exchange = {
                target: 5,
                attackers: [3, 6],
                defenders: [1]
            };
            expect($engine.evaluateExchange(exchange)).toBeLessThan(0);
        });

    //  SCENARIO #9: Knight and bishop attack pawn defended by rook
    //  Result: Captures pawn + rook, loses knight, material gained.
    //  . . . . R . . .
    //  . . . . . . . .
    //  . . . .-P-. . .     100 - 310 + 480 = +270
    //  . . . . . . n .
    //  . . . . . . . .     target: 1
    //  . b . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [6]
    //  . . . . . . . .     EXPECT: +
    //
        it('(SCENARIO #9) should return +', function() {
            var exchange = {
                target: 1,
                attackers: [5, 2],
                defenders: [6]
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    //  SCENARIO #10: Knight and bishop attack rook defended by pawn and queen.
    //  Result: Captures rook, loses knight, stops counting: gains material.
    //  . . . . . . . .
    //  . . . . . P . .
    //  Q . . .-R-. . .     480 - 310 = +170
    //  . . . . . . n .
    //  . . . . . . . .     target: 6
    //  . b . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [1, 7]
    //  . . . . . . . .     EXPECT: +
    //
        it('(SCENARIO #10) should return +', function() {
            var exchange = {
                target: 6,
                attackers: [5, 2],
                defenders: [7, 1]
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    //  SCENARIO #11: Knight and bishop attack pawn defended by rook and king.
    //  Result: Captures pawn + rook, loses knight + bishop, not worth it.
    //  . . . . R . . .
    //  . . . K . . . .
    //  . . . .-P-. . .     100 - 310 + 480 - 320 = -50
    //  . . . . . . n .
    //  . . . . . . . .     target: 1
    //  . b . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [3, 6]
    //  . . . . . . . .     EXPECT: -
    //
        it('(SCENARIO #11) should return -', function() {
            var exchange = {
                target: 1,
                attackers: [2, 5],
                defenders: [3, 6]
            };
            expect($engine.evaluateExchange(exchange)).toBeLessThan(0);
        });

    //  SCENARIO #12: Bishop and two rooks attack knight defended by knight and queen.
    //  Result: Captures knight + knight + queen, loses bishop + rook, gained material.
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . N Q . . . .     310 - 320 + 310 - 480 + 920 = +740
    //  . . . .-N-. . r
    //  . . . . . . . .     target: 2
    //  . . . . . . . .     attackers: [5, 6, 6]
    //  . b . . . . . .     defenders: [2, 7]
    //  . . . . r . . .     EXPECT: +
    //
        it('(SCENARIO #12) should return +', function() {
            var exchange = {
                target: 2,
                attackers: [5, 6, 6],
                defenders: [2, 7]
            };
            expect($engine.evaluateExchange(exchange)).toBeGreaterThan(0);
        });

    });

//  Test evaluating multiple exchanges in context of a game position.
//  -----------------------------------------------------------------
    describe('multiple exchanges', function() {
        var $rules, $engine;

        beforeEach(function() {
            module('app');
            inject(function(rules) {
                $rules = rules;
            });
            inject(function(engine) {
                $engine = engine;
            });
        });

        it('should exist', function() {
            expect(typeof $engine.evaluateExchanges).toBe('function');
        });
        
    //  SCENARIO #0: Both queens hanging. White's move.
    //  EXPECT: 700+
    //  K . . . . . . .     exchanges       target  attackers   defenders
    //  . . . . . . . .     ACTIVE:         7       [7]         []            
    //  . . . . . . . .     PASSIVE:        7       [7]         []
    //  . . . Q . . . .     
    //  . . . . . . . .
    //  . . . q . . . .
    //  . . . . . . . .
    //  k . . . . . . .     FEN: 'K7/8/8/3Q4/8/3q4/8/k7 w - - 0 1'  
    //
        it('(SCENARIO #0) should return 700+', function() {
            var position = $rules.createPosition('K7/8/8/3Q4/8/3q4/8/k7 w - - 0 1'),
                active, passive, evaluation;
                
            active = $engine.evaluateExchanges(position, 0);
            passive = $engine.evaluateExchanges(position, 1);
            evaluation = active + passive;

            expect(active).toBeGreaterThan(750);
            expect(passive).toBeLessThan(0);
            expect(evaluation).toBeGreaterThan(700);
        });

    //  SCENARIO #1: White queen hanging. Two black rooks hanging.
    //  EXPECT: 300+
    //  K . . R . . . .     exchanges       target  attackers   defenders
    //  . . R . . . . .     ACTIVE:         5       [2]         []            
    //  . . . . n . . .                     5       [2]         []
    //  . . . . . . . .     PASSIVE:        7       [1]         []    
    //  . . . . . . . .
    //  . . . . . . . N
    //  . . . . . . . .
    //  k . . . . . q .     FEN: 'K2R4/2R5/4n3/8/8/7N/8/k5q1 w - - 0 1'  
    //
        it('(SCENARIO #1) should return 300+', function() {
            var position = $rules.createPosition('K2R4/2R5/4n3/8/8/7N/8/k5q1 w - - 0 1'),
                active, passive, evaluation;
                
            active = $engine.evaluateExchanges(position, 0);
            passive = $engine.evaluateExchanges(position, 1);
            evaluation = active + passive;

            expect(active).toBeGreaterThan(300);
            expect(passive).toBeLessThan(0);
            expect(evaluation).toBeGreaterThan(300);
        });
        
    });

});
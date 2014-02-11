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

    //  CAPTURE LEGALITY

        it('[Capture legality] should be correct', function() {

            function canCapture(capturePiece, recapturePiece) {
                if (capturePiece) {
                    if ((capturePiece === 3) && recapturePiece) {
                        return false;
                    }
                    return true;
                }
                return false;
            }

            expect(canCapture(1, undefined)).toBe(true);
            expect(canCapture(1, undefined)).toBe(true);
            expect(canCapture(1, 1)).toBe(true);
            expect(canCapture(1, 3)).toBe(true);
            expect(canCapture(3, 1)).toBe(false);
            expect(canCapture(3, 3)).toBe(false);
        });

    //  SCENARIO #0
    //  Simple cature.

    //  [Scenario #0/a]: pawn captures a pawn
    //  [Optimal sequence]: +pawn
    //  [Expected result]: +100
    //  . . . . . . . .     p - black pawn
    //  . . . . . . . .     P - white pawn
    //  . .-p-. . . . .     -p- square of exchange
    //  . P . . . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: []
    //  . . . . . . . .     EXPECT: +
    //
        it('[Scenario #0/a] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [1],
                defenders: []
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #0/b]: king captures a pawn
    //  [Optimal sequence]: +pawn
    //  [Expected result]: +100
    //  . . . . . . . .
    //  . . . . . . . .
    //  . .-p-. . . . .
    //  . . K . . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [3]
    //  . . . . . . . .     defenders: []
    //  . . . . . . . .     EXPECT: +100
    //
        it('[Scenario #0/b] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [3],
                defenders: []
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #0/c]: multiple attackers, undefended knight
    //  [Optimal sequence]: +knight
    //  [Expected result]: ~315
    //  . . . . . . . .
    //  . . . . . K . .
    //  . . . . .-n-. .
    //  . . . . . . P .
    //  . . . . . . . .     target: 2
    //  . . B . . . . .     attackers: [1,3,5]
    //  . . . . . . . .     defenders: []
    //  . . . . . . . .
    //
        it('[Scenario #0/c] eval should be ~ 315', function() {
            var exchange = {
                target: 2,
                attackers: [1, 3, 5],
                defenders: []
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBeGreaterThan(300);
            expect(evaluation).toBeLessThan(330);
        });

    //  SCENARIO #1
    //  Cature, recapture.

    //  [Scenario #1/a]: exchange of pawns
    //  [Optimal sequence]: +pawn -pawn
    //  [Expected result]: 0
    //  . . . . . . . .
    //  . . . . p . . .
    //  . . . . .-p-. .
    //  . . . . . . P .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .
    //
        it('[Scenario #1/a] eval should be 0', function() {
            var exchange = {
                target: 1,
                attackers: [1],
                defenders: [1]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBe(0);
        });

    //  [Scenario #1/b]: trade pawn for queen
    //  [Optimal sequence]: +queen -rook
    //  [Expected result]: ~830
    //  . . . . . . . .
    //  . . . . p . . .
    //  . . . . .-q-. .
    //  . . . . . . P .
    //  . . . . . . . .     target: 7
    //  . . . . . . . .     attackers: [1]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .
    //
        it('[Scenario #1/b] eval should be ~ 830', function() {
            var exchange = {
                target: 7,
                attackers: [1],
                defenders: [1]
            };
            var evaluation = $engine.evaluateExchange(exchange);            
            expect(evaluation).toBeGreaterThan(800);
            expect(evaluation).toBeLessThan(900);
        });

    //  [Scenario #1/c]: trade queen for rook
    //  [Optimal sequence]: don't capture
    //  [Expected result]: 0
    //  . . . . . . . .
    //  . . . . k . . .
    //  . . . . .-r-. .
    //  . . . . . . . .
    //  . . . . . . . .     target: 6
    //  . . . . . Q . .     attackers: [7]
    //  . . . . . . . .     defenders: [3]
    //  . . . . . . . .
    //
        it('[Scenario #1/c] eval should be 0', function() {
            var exchange = {
                target: 6,
                attackers: [7],
                defenders: [3]
            };
            var evaluation = $engine.evaluateExchange(exchange);            
            expect(evaluation).toBe(0);
        });

    //  SCENARIO #2
    //  Capturing with kings.

    //  [Scenario #2/a]: king attacks defended pawn
    //  [Optimal sequence]: capture is illegal
    //  [Expected result]: 0
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . k . . .
    //  . . . .-p-. . .     target: 1
    //  . . . . K . . .     attackers: [3]
    //  . . . . . . . .     defenders: [3]
    //  . . . . . . . .
    //

        it('[Scenario #2/a] eval should be 0', function() {
            var exchange = {
                target: 1,
                attackers: [3],
                defenders: [3]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #2/b]: pawn captures pawn, king can't recapture
    //  [Optimal sequence]: +pawn
    //  [Expected result]: +100
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . k . . .
    //  . . . .-p-. . .     target: 1
    //  . . . P K . . .     attackers: [1, 3]
    //  . . . . . . . .     defenders: [3]
    //  . . . . . . . .
    //
        it('[Scenario #2/b] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [1, 3],
                defenders: [3]
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #2/c]: pawn exchange with kings
    //  [Optimal sequence]: +pawn -pawn
    //  [Expected result]: 0
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . n . . . .
    //  . . . . k . . .
    //  . . . .-p-. . .     target: 1
    //  . . . P K . . .     attackers: [1, 3]
    //  . . . . . . . .     defenders: [2, 3]
    //  . . . . . . . .
    //
        it('[Scenario #2/c] eval should be 0', function() {
            var exchange = {
                target: 1,
                attackers: [1, 3],
                defenders: [2, 3]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #2/d]: exchange bishop for knight + pawn, kings assist.
    //  [Optimal sequence]: +knight -bishop +pawn
    //  [Expected result]: ~90
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . p k . . .
    //  . . . .-n-. . R     target: 2
    //  . . . . K . . .     attackers: [3, 5, 6]
    //  . . B . . . . .     defenders: [1, 3]
    //  . . . . . . . .
    //
        it('[Scenario #2/d] eval should be ~ 90', function() {
            var exchange = {
                target: 2,
                attackers: [6, 3, 5],
                defenders: [1, 3]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBeGreaterThan(80);
            expect(evaluation).toBeLessThan(100);
        });

    //  [Scenario #2/e]: exchange knight for rook.
    //  [Optimal sequence]: +rook -knight
    //  [Expected result]: ~160
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . p k p . .
    //  . . . .-r-. . .     target: 6
    //  . . N . . K . .     attackers: [2, 3]
    //  . . . . . . . .     defenders: [1, 1, 3]
    //  . . . . . . . .
    //
        it('[Scenario #2/e] eval should be ~ 160', function() {
            var exchange = {
                target: 6,
                attackers: [2, 3],
                defenders: [1, 1, 3]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBeGreaterThan(150);
            expect(evaluation).toBeLessThan(180);
        });

    //  [Scenario #2/f]: exchange knight for rook.
    //  [Optimal sequence]: don't exchange
    //  [Expected result]: 0
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . . . k p . .
    //  R . . .-n-. . .     target: 2
    //  . . . . . K . .     attackers: [3, 6]
    //  . . . . . . . .     defenders: [1, 3]
    //  . . . . . . . .
    //
        it('[Scenario #2/f] eval should be 0', function() {
            var exchange = {
                target: 2,
                attackers: [3, 6],
                defenders: [1, 3]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBe(0);
        });

    //  SCENARIO #3
    //  Chained exchanges.

    //  [Scenario #3/a]: two pawns against one.
    //  [Optimal sequence]: +pawn -pawn +pawn
    //  [Expected result]: +100
    //  . . . . . . . .
    //  . p . . . . . .
    //  . .-p-. . . . .
    //  . P . P . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1, 1]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .
    //
        it('[Scenario #3/a] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [1, 1],
                defenders: [1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #3/b]: exchange pawns, rook backs off.
    //  [Optimal sequence]: +pawn -pawn
    //  [Expected result]: 0
    //  . . r . . . . .
    //  . p . . . . . .
    //  . .-p-. . . . .
    //  . . . P . . . .
    //  . . . . . . . .     target: 1
    //  . . R . . . . .     attackers: [1, 6]
    //  . . . . . . . .     defenders: [1, 6]
    //  . . . . . . . .
    //
        it('[Scenario #3/b] eval should be 0', function() {
            var exchange = {
                target: 1,
                attackers: [1, 6],
                defenders: [1, 6]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #3/c]: capture two pawns, lose one, exchange knights.
    //  [Optimal sequence]: +pawn -pawn +pawn -knight +knight
    //  [Expected result]: +100
    //  . . . . . . . .
    //  . p . . n . . .
    //  . .-p-. . . . .
    //  . P . . . . . .
    //  . . . N . . . .     target: 1
    //  . . . . . . . .     attackers: [1, 2, 7]
    //  . . Q . . . . .     defenders: [1, 2]
    //  . . . . . . . .
    //
        it('[Scenario #3/c] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [1, 2, 7],
                defenders: [1, 2]
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #3/d]: exchange two pairs of pawns.
    //  [Optimal sequence]: +pawn -pawn +pawn -pawn
    //  [Expected result]: 0 
    //  . . . . . . . .
    //  . p . p . . . .
    //  . .-p-. . . . .
    //  . P . P . . . .
    //  . . . . . . . .     target: 1
    //  . . . . . . . .     attackers: [1, 1]
    //  . . . . . . . .     defenders: [1, 1]
    //  . . . . . . . .
    //
        it('[Scenario #3/c] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [1, 1],
                defenders: [1, 1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #3/d]: exchange queen for rook.
    //  [Optimal sequence]: don't bother
    //  [Expected result]: 0 
    //  . . . . r . . .
    //  . . . . . . . .
    //  . . . .-r-. . .
    //  . . . . . . . .
    //  . . Q . . . . .     target: 6
    //  . . . . . . . .     attackers: [7]
    //  . . . . . . . .     defenders: [6]
    //  . . . . . . . .
    //
        it('[Scenario #3/d] eval should be 0', function() {
            var exchange = {
                target: 6,
                attackers: [7],
                defenders: [6]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #3/e]: exchange rook for bishop + pawn.
    //  [Optimal sequence]: don't bother none
    //  [Expected result]: 0 
    //  . . . . . . . .
    //  . . . . . p . .
    //  R . . .-b-. . .
    //  . . . . K . . .
    //  . . . . . . . .     target: 5
    //  . . . . . . . .     attackers: [3, 6]
    //  . . . . . . . .     defenders: [1]
    //  . . . . . . . .
    //
        it('[Scenario #3/e] eval should be 0', function() {
            var exchange = {
                target: 5,
                attackers: [3, 6],
                defenders: [1]
            };
            expect($engine.evaluateExchange(exchange)).toBe(0);
        });

    //  [Scenario #3/f]: knight takes pawn, rook backs off because of the bishop
    //  [Optimal sequence]: +pawn
    //  [Expected result]: 100 
    //  . . . . r . . .
    //  . . . . . . . .
    //  . . . .-p-. . .
    //  . . . . . . N .
    //  . . . . . . . .     target: 1
    //  . B . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [6]
    //  . . . . . . . .
    //
        it('[Scenario #3/f] eval should be +100', function() {
            var exchange = {
                target: 1,
                attackers: [5, 2],
                defenders: [6]
            };
            expect($engine.evaluateExchange(exchange)).toBe(100);
        });

    //  [Scenario #3/g]: knight captures rook, pawn recaptures, bishop waits
    //  [Optimal sequence]: +rook -knight
    //  [Expected result]: ~160 
    //  . . . . . . . .
    //  . . . . . p . .
    //  q . . .-r-. . .
    //  . . . . . . N .
    //  . . . . . . . .     target: 6
    //  . B . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [1, 7]
    //  . . . . . . . .
    //
        it('[Scenario #3/g] eval should be ~160', function() {
            var exchange = {
                target: 6,
                attackers: [5, 2],
                defenders: [7, 1]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBeGreaterThan(150);
            expect(evaluation).toBeLessThan(180);
        });

    //  [Scenario #3/h]: trade knight + bishop for pawn + rook
    //  [Optimal sequence]: don't start this shit
    //  [Expected result]: 0 
    //  . . . . r . . .
    //  . . . k . . . .
    //  . . . .-p-. . .
    //  . . . . . . N .
    //  . . . . . . . .     target: 1
    //  . B . . . . . .     attackers: [2, 5]
    //  . . . . . . . .     defenders: [3, 6]
    //  . . . . . . . .
    //
        it('[Scenario #3/h] eval should be 0', function() {
            var exchange = {
                target: 1,
                attackers: [2, 5],
                defenders: [3, 6]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBe(0);
        });

    //  [Scenario #3/i]: take two knights lose a bishop, rooks hold off the queen
    //  [Optimal sequence]: +knight -bishop +knight
    //  [Expected result]: ~300 
    //  . . . . . . . .
    //  . . . . . . . .
    //  . . N Q . . . .
    //  . . . .-N-. . r
    //  . . . . . . . .     target: 2
    //  . . . . . . . .     attackers: [5, 6, 6]
    //  . b . . . . . .     defenders: [2, 7]
    //  . . . . r . . .
    //
        it('[Scenario #3/i] eval should be ~300', function() {
            var exchange = {
                target: 2,
                attackers: [5, 6, 6],
                defenders: [2, 7]
            };
            var evaluation = $engine.evaluateExchange(exchange);
            expect(evaluation).toBeGreaterThan(280);
            expect(evaluation).toBeLessThan(320);
        });

    });

/*
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
*/

});
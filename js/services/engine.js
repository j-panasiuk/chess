'use strict';

app.factory('engine', function($q, rules, game) {
    console.log('%cCreating engine...', LOG.action);
//
//
    var engine = {};
//  Property      		Description
//  ----------------------------------------------------------------------------
//  tree              	(Object) Represents chess game tree, with current position being
//                      the root and each possible becoming subsequent child node.
//                      Tree branching repeats recursively up to a given depth.

//  Declare local variables.
    var tree = {}, _node = {}, maxDepth = 1;


    Object.defineProperties(_node, {
        'position':     { writable: true, configurable: true, enumerable: true },
        'move':         { writable: true, configurable: true, enumerable: true },
        'depth':       	{ writable: true, configurable: true, enumerable: true },
        'parent':      	{ writable: true, configurable: true, enumerable: true },
        'children':     { writable: true, configurable: true, enumerable: true },
        'value':        { writable: true, configurable: true, enumerable: true },
        'isRoot':      	{ get: function() { return this.depth === 0; } },
        'isLeaf':      	{ get: function() { return !this.children; } },
        'isMax':       	{ get: function() { return !(this.depth % 2); } },
        'isMin':       	{ get: function() { return !!(this.depth % 2); } },
        'ramify': {
            value: function() {
                var childNodes,
                    self = this;

                if (_.isArray(this.children)) {
                    //console.log('%cThis node is already branched.', LOG.warn, node);
                    return;
                }
                //console.debug(self.position.moves.length);
                childNodes = this.position.moves.map(function(move) {
                    return createNode(self.position.yields(move), move.san, self);
                });
                this.children = childNodes;
                //console.log('%cTree node has ramified:', LOG.attention, this.children);
            }
        },
        'evaluate': {
            value: function() {
                var childValues;

                if (this.isLeaf) {
                    this.value = evaluation(this.position);
                } else {
                    childValues = this.children.map(function(child) { return child.value; });
                    this.value = this.isMax ? _.max(childValues) : _.min(childValues);
                }
            }
        }
    });

    function createNode(position, move, parentNode) {
        //console.assert(position.fen.match(rules.validFen), 'Invalid position.', position);
        //console.assert(_node.isPrototypeOf(parentNode) || (parentNode === undefined), 'Invalid parent node.', parentNode);
    //  Node factory function.
    //  Creates a new game tree node, based on given postion.
    //  If no parentNode is given, create tree root.
    //  Otherwise create child node.
        var node;
        function Node() {};
        Node.prototype = _node;
        node = new Node();

        node.position = position;
        node.move = move || null;
        node.parent = parentNode || null;
        node.depth = parentNode ? parentNode.depth + 1 : 0;
        node.children = null;

        return node;
    }

//  Define game tree.
    Object.defineProperties(tree, {
        'root': { value: null, writable: true, configurable: true, enumerable: true },
        'plant': { 
            value: function plantTree(position) {
                console.log('%cPlanting game tree...', LOG.action);
                this.root = createNode(position);
            } 
        },
        'grow': {
            value: function growTree() {
                var nodes = 0;

                console.log('%cExpanding game tree...', LOG.action);
                console.time('Growing Tree');
                expand(this.root);

                function expand(currentNode) {
                    if (currentNode.depth >= maxDepth) {
                        nodes += 1;
                        return;
                    } else {
                        currentNode.ramify();
                        for (var i = 0; i < currentNode.children.length; i++) {
                            expand(currentNode.children[i]);
                        }
                        nodes += 1;
                    }                    
                }

                console.timeEnd('Growing Tree');
                console.log('%cGrown nodes:', LOG.state, nodes);
                console.log('%cExpanded tree:', LOG.state, this);
            }
        },
        'analyze': {
            value: function analyzeTree() {
                var nodes = 0;

                console.log('%cAnalyzing tree...', LOG.action);
                console.time('Analyzing Tree');
                analyzeNode(this.root);

                function analyzeNode(currentNode) {
                    if (currentNode.isLeaf) {
                        currentNode.evaluate();
                        nodes += 1;
                        return;
                    } else {
                        for (var i = 0; i < currentNode.children.length; i++) {
                            analyzeNode(currentNode.children[i]);
                        }
                        currentNode.evaluate();
                        nodes += 1;
                    }
                }

                console.time('Analyzing Tree');
                console.log('%cAnalyzed nodes:', LOG.state, nodes);
                console.log('%cTree root value:', LOG.state, this.root.value);
            }
        },
        'getMove': {
            value: function(position) {                
                var childNodes, node, move,
                    deferred = $q.defer();

                try {

                //  Reset game tree to current position.
                    this.plant(position);

                //  Branch out the tree up to given depth.
                    this.grow();

                //  Assign values to all tree nodes.
                    this.analyze();

                //  Sort best available moves, based on computed values.
                    childNodes = this.root.children;
                    childNodes = _.sortBy(childNodes, 'value');

                //  Select highest or lowest valued move, depending on color.
                    node = game.activeColor ? _.first(childNodes) : _.last(childNodes);
                    move = node.move;                                    

                } catch (e) {

                    console.log('%cCaught error during move selection.', LOG.warn, e.message);
                    deferred.reject(e);
                    //move = _.sample(position.moves);

                } finally {

                    console.log('%cOptimal move:', LOG.state, move.san);

                }

                deferred.resolve(move);
                return deferred.promise; 
            }
        }
    });

    function evaluation(position) {
        //console.assert(position.fen.match(rules.validFen), 'Invalid position.', position);
    //  Evaluate position. Return computed value.
        var sign,
            colors = [0, 1], 
            attacked = position.attacked,
            pieces = position.pieceList,
            activity = rules.ACTIVITY,
            proximity = rules.proximity,
            value = 0;

        sign = {};
        sign[0] = 1;
        sign[1] = -1;     

        function evaluateMaterial(color) {
            var value = 0;
            pieces[color].forEach(function(piece) { value += piece.points; });
            return sign[color] * value;
        }

        function evaluateActivity(color) {
            var value = 0;
            pieces[color].forEach(function(piece) { value += activity[piece.code][piece.square] || 0; });
            return sign[color] * value;
        }

        function evaluateDevelopment(color) {
        //  Apply penalty for light pieces staying on the first rank.
            var firstRank = color ? 7 : 0,
                value = 0;
            pieces[color].filter(function(piece) { return piece.isLight; }).forEach(function(piece) {
                if (piece.square.rank === firstRank) {
                    value -= 5;
                }
            });
            return sign[color] * value;
        }

        function evaluateKingSafety(color) {
            var king = pieces.kings(color)[0],
                kingProximity = proximity(king.square, 1),
                defenders = 0,
                attackers = 0,
                empty = 0,
                value = 0;

        //  Apply penalty when the king is checked.
        //  Double check is particularly dangerous!
            switch (_.size(king.checks)) {
                case 0:     break;
                case 1:     value -= 5; break;
                default:     value -= 25;
            }

        //  Count defenders, attackers and empty squares around the king (within 1 square distance).
        //  The more defenders the better. Every empty square except for first two also decrease safety.
            kingProximity.forEach(function(square) {
                var piece = position.pieces[square]; 
                if (piece) {
                    if (piece.color === king.color) {
                        defenders += 1;
                    } else {
                        attackers += 1;
                    }
                } else {
                    empty += 1;
                }
            });
            value += defenders;
            value -= 2 * attackers; 
            value -= 2 * Math.max(0, empty - 2);
            return sign[color] * value;
        }
        
        colors.forEach(function evaluateColor(color) {
            value += evaluateMaterial(color);
            value += evaluateExchanges(position, color);
            value += evaluateActivity(color);
            value += evaluateDevelopment(color);
            value += evaluateKingSafety(color);
        });

        return value;
    }

//  Exchange evaluation.
    function evaluateExchange(exchange) {
    //  Returns expected outcome of exchanges at position occupied by given piece.
    //  Exchanges are evaluated with optimal captures for both sides (always try to capture
    //  a piece with the least valuable piece first, in case of enemy recapture).
    //  
        var defenders, // [target | sorted(defenders) | king]
            attackers, // [sorted(attackers) | king]
            isAttackersTurn, // Indicates who's next to capture.
            fallback,
            nextCapture,
            nextTarget, // Piece to be captured next.
            value, // Bodycount updated after each (re)capture.
            POINTS = rules.PIECE_POINTS; // Piece values hash (PIECE_POINTS[1] == 100 ...)

    //  Validate exchange object.
    //  EXPECT exchange = {
    //      target:         piece type under attack
    //      attackers:      array of attacking piece types, sorted increasingly
    //                      pawn, knight, rook, pawn == [1, 1, 2, 5]
    //      defenders:      array of defending pieces, similar to above
    //  }
    //
        try {
            if (!exchange) throw 'Missing exchage object';
            if (!exchange.target || !exchange.defenders || !exchange.attackers) throw 'Invalid exchage type';
            if (!_.contains([1,2,5,6,7], exchange.target)) throw 'Invalid exchange target';

            if (!exchange.attackers.length || exchange.attackers.some(function(attacker) {
                return !_.contains([1,2,3,5,6,7], attacker);
            })) throw 'Invalid attackers';
        
            if (exchange.defenders.length && exchange.defenders.some(function(defender) {
                return !_.contains([1,2,3,5,6,7], defender);
            })) throw 'Invalid defenders';
        
        } catch(e) {
            console.log('%cCaught invalid evaluate exchange call', LOG.warn, e.message);
            return undefined;
        }

    //  Check if there are any defenders. If not, the exchange is a simple capture.
    //  In that case return target piece value, as it can be grabbed for free.
    //
        if (!exchange.defenders.length) {
            return POINTS[exchange.target];
        }

    //  Arrange defenders array (at least 1 defender at this point).
    //  Target piece has no choice, it's going to get captured first no matter what.
    //  Following defenders are sorted in increasing value order, since less valuable
    //  pieces should capture first. The king is always placed last, because it may
    //  only take part in exchange when the square is not attacked anymore by the enemy.
    //
        defenders = exchange.defenders;
        if (_.contains(defenders, 3)) {
            _.pull(defenders, 3);
            defenders.sort().push(3);
        } else {
            defenders.sort();
        }
        defenders.unshift(exchange.target);

    //  Arrange attackers array.
    //  Sort pieces in increasing value order.
    //  The king goes last.
    //
        attackers = exchange.attackers;
        if (_.contains(attackers, 3)) {
            _.pull(attackers, 3);
            attackers.sort().push(3);
        } else {
            attackers.sort();
        }

        isAttackersTurn = true; // Attacker captures first.
        value = 0; // Nothing captured yet.
        fallback = {
            'attacker': 0,
            'defender': null,
            'sentinel': 'attacker'
        }; // Fallback values in case the exchange goes horribly wrong.
        nextCapture = canCapture(attackers[0], defenders[0]); // Check next capture legality.

    //  Return if the first capture is illegal.
    //  This is possible when a king tries to capture defended piece.
        if (!nextCapture) {
            return 0;
        }

        while (nextCapture) {

        //  Set fallback values.
            if (isAttackersTurn) {
                if (value > fallback.attacker) {
                //  Current value is an improvement over previous attacker fallback point.
                //  Check if abandoning current fallback will not cede sentinel position to
                //  a defender's inferior fallback. In that case, leave current sentinel in place.
                //  Otherwise, set attacker fallback to current value.
                //
                    if ((fallback.sentinel === 'defender') || (fallback.defender >= fallback.attacker)) {
                        fallback.attacker = value;
                        fallback.sentinel = 'defender';
                    }
                }
            } else {
                if (fallback.defender === null) {
                //  Establish first defender fallback (after first capture).
                    fallback.defender = value;
                }
                if (value < fallback.defender) {
                //  Current value is an improvement over previous defender fallback point.
                //  Before abandoning sentinel position, compare with next attacker fallback.
                //
                    if ((fallback.sentinel === 'attacker') || (fallback.attacker <= fallback.defender)) {
                        fallback.defender = value;
                        fallback.sentinel = 'attacker';
                    }
                }
            }

            nextTarget = shiftNextTarget(isAttackersTurn);
            value += isAttackersTurn ? POINTS[nextTarget] : -POINTS[nextTarget];
            

            if (!isAttackersTurn) {
                nextCapture = canCapture(attackers[0], defenders[0]);
            } else {
                nextCapture = canCapture(defenders[0], attackers[0]);
            }

            isAttackersTurn = !isAttackersTurn;
        }

    //  Evaluate optimal exit point.
    //
    //  First established fallback point in the sequence is the sentinel.
    //  The exchange is simulated from the beginning. 
    //  Once reached, the sentinel has to make a decision. It can:
    //  A.  Stop the exchange       (return current value)
    //  B.  Continue exchanging     (let next fallback controller make the decision)
    //
    //  The sentinel makes its decision by comparing its current value with expected alternatives
    //  + opponent's fallback point
    //  + final value after all exchanges have been made
    //
    //  After continuing, exit point will be selected by the opponent.
    //  This means that if at least one of the alternatives is inferior to the current
    //  value, the opponent will choose it.
    // 
    //  Thus it only makes sense to continue, if both remaining exit values are superior. 
    //
        if (fallback.sentinel === 'attacker') {
            if ((fallback.attacker < fallback.defender) && (fallback.attacker < value)) {
            //  Continue. Defender goes for minimal losses.
                return fallback.defender < value ? fallback.defender : value;
            } else {
            //  Attacker stops capturing here.
                return fallback.attacker;
            }
        } else {
            if ((fallback.defender > fallback.attacker) && (fallback.defender > value)) {
            //  Continue. Attacker goes for maximal gain.
                return fallback.defender > value ? fallback.defender : value;
            } else {
            //  Defender stops capturing here.
                return fallback.defender;
            } 
        }

        function canCapture(capturePiece, recapturePiece) {
        //  A capture is possible as long as there is a capturing piece ready
        //  and it's not king capturing a defended piece.
            if (capturePiece) {
                //if ((capturePiece === 3) && recapturePiece) {
                //    return false;
                //}
                return true;
            }
            return false;
        }

        function shiftNextTarget(isAttackersTurn) {
        //  Return next target (piece which will now be occupying target square).
        //  Shift attackers/defenders array by one, since new target piece can't
        //  be defending its own square.
        //  
            return isAttackersTurn ? defenders.shift() : attackers.shift();
        }
    }
    engine.evaluateExchange = evaluateExchange;


    function evaluateExchanges(position, color) {
    //  Evaluate all potential exchanges.
    //  Active side can choose to initiate any of available exchanges (and will
    //  most likely go for the most advantageous one). Passive side, however, has
    //  to wait one turn to initiate exchange, so its most advantageous option
    //  will very likely have been prevented by the opponent. Because of this
    //  passive side's best exchage receives penalty multiplier for being "threat
    //  of exchange" rather than actual exchange possibility.
    //
    //  exchange: {                                 Required:
    //      target: <captured piece type>           1
    //      attackers: [<attacker piece types>]     1+
    //      defenders: [<defender piece types>]     0+ 
    //  }
    //
        var capturablePieces,
            piece,
            exchanges = [],
            enemy = +!color,
            sign = [1, -1],
            attacked = position.attacked,
            value = 0;

        capturablePieces = position.pieceList[enemy].filter(function(piece) {
            return attacked[piece.square][color].length && (piece.name !== 'king');
        });

        for (var i = 0; i < capturablePieces.length; i++) {
            piece = capturablePieces[i];
            exchanges.push({
                'target': piece.type,
                'attackers': attacked[piece.square][color],
                'defenders': attacked[piece.square][enemy]
            });  
        }

        if (!exchanges.length) {
        //  Can't capture anything at the moment.
            return 0;
        }

        for (var i = 0; i < exchanges.length; i++) {
            value += evaluateExchange(exchanges[i]);
        }

        value *= (color === position.activeColor) ? 0.8 : 0.05;

        return sign[color] * value;

    /*
        var exchangeDeltas,
            EXCHANGES,
            capturablePieces,
            piece,
            ATTACKED,
            enemy,
            sign = [1, -1], // Value multiplier (sign) for white (+) and black (-).
            EXCHANGE_PRIMARY_MODIFIER = 0.9, // Multiplier for the first piece to capture.
            EXCHANGE_PRIMARY_THREAT_MODIFIER = 0.04, // Multiplier for opponent's future exchange threat.
            EXCHANGE_THREAT_MODIFIER = 0.5, // Multiplier for the rest of possible exchanges.
            value = 0; // Final evaluation.

    //  Look for enemy pieces under attack (exclude the king).
    //  For each attacked piece, store information about the target, attacking and defending
    //  pieces in an `exchange` object, to be evaluated later.
    //
        EXCHANGES = [];
        ATTACKED = position.attacked;
        enemy = +!color;

        capturablePieces = position.pieceList[enemy].filter(function(piece) {
            return ATTACKED[piece.square][color].length && (piece.name !== 'king');
        });

        for (var i = 0; i < capturablePieces.length; i++) {
            piece = capturablePieces[i];
            EXCHANGES.push({
                'target': piece.type,
                'attackers': ATTACKED[piece.square][color],
                'defenders': ATTACKED[piece.square][enemy]
            });  
        }

        if (!EXCHANGES.length) {
        //  Can't capture anything at the moment.
            return 0;
        }

    //  All potential captures for this color have been established
    //  (at this point there must be at least one).
    //
    //  Evaluate every one of them
    //  (exchange evaluation returns expected material change from the exchange,
    //  where both sides keep recapturing as long as it's beneficial for them).
    //
    //  Discard negative (and neutral) deltas, as current side gains no benefit
    //  from them, so they may well be ignored. If all exchanges are discarded,
    //  return stop evaluation and return 0 value.
    //
    //  Finally, sort them in increasing order, since the larger deltas present
    //  bigger threat to the opponent, and thus should be attended to first.
    //
        exchangeDeltas = EXCHANGES.map(function(exchange) {
            return evaluateExchange(exchange);
        });

        exchangeDeltas = exchangeDeltas.filter(function(delta) {
            return sign[color] * delta > 0;
        });

        exchangeDeltas = exchangeDeltas.map(function(delta) {
            return Math.abs(delta);
        });

        if (!exchangeDeltas.length) {
        //  No favorable captures. Abort.
            return 0;
        } 

        exchangeDeltas.sort();

    //  Threat of an exchange must be evaluated differently, depending on which side has
    //  the next move. Active side can initiate the most beneficial exchange and gain
    //  material advantage. Passive side, however, has to wait one turn, so it is very likely
    //  that the opponent will have responded to the most dangerous exchange. Becuase of this
    //  passive side's largest delta receives penalty multiplier for being "threat of exchange", 
    //  rather than clear material gain.
    //
        if (position.activeColor !== color) {
            value += EXCHANGE_PRIMARY_THREAT_MODIFIER * exchangeDeltas.pop();
        } else {
            value += EXCHANGE_PRIMARY_MODIFIER * exchangeDeltas.pop();
        }        
        for (var i = 0; i < exchangeDeltas.length; i++) {
            value += EXCHANGE_THREAT_MODIFIER * evaluateExchange(exchangeDeltas[i]);
        }

        return sign[color] * value;
        */
    }
    engine.evaluateExchanges = evaluateExchanges;    

    engine.tree = tree;
    return engine;
});
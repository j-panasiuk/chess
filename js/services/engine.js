'use strict';

app.factory('engine', function($q, rules, game) {
	console.log('%cCreating engine...', LOG.action);
//
//
	var engine = {};
//	Property 			Description
//	----------------------------------------------------------------------------
//	tree 				(Object) Represents chess game tree, with current position being
//						the root and each possible becoming subsequent child node.
//						Tree branching repeats recursively up to a given depth.

//	Declare local variables.
	var tree = {}, _node = {}, maxDepth = 1;


	Object.defineProperties(_node, {
		'position': 	{ writable: true, configurable: true, enumerable: true },
		'move': 		{ writable: true, configurable: true, enumerable: true },
		'depth': 		{ writable: true, configurable: true, enumerable: true },
		'parent': 		{ writable: true, configurable: true, enumerable: true },
		'children': 	{ writable: true, configurable: true, enumerable: true },
		'value':		{ writable: true, configurable: true, enumerable: true },
		'isRoot': 		{ get: function() { return this.depth === 0; } },
		'isLeaf': 		{ get: function() { return !this.children; } },
		'isMax': 		{ get: function() { return !(this.depth % 2); } },
		'isMin': 		{ get: function() { return !!(this.depth % 2); } },
		'ramify': {
			value: function() {
				console.debug('Ramify...', this.position);
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
	//	Node factory function.
	//	Creates a new game tree node, based on given postion.
	//	If no parentNode is given, create tree root.
	//	Otherwise create child node.
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

//	Define game tree.
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

				//	Reset game tree to current position.
					this.plant(position);

				//	Branch out the tree up to given depth.
					this.grow();

				//	Assign values to all tree nodes.
					this.analyze();

				//	Sort best available moves, based on computed values.
					childNodes = this.root.children;
					childNodes = _.sortBy(childNodes, 'value');

				//	Select highest or lowest valued move, depending on color.
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
	//	Evaluate position. Return computed value.
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

		function evaluateAttacked(color) {
			var enemy = +!color,
				exchanges = [],
				hanging = [],
				value = 0;

			pieces[color].filter(function(piece) { return attacked[piece.square][enemy].length; })
			.forEach(function(piece) {
				if (attacked[piece.square][piece.color].length) {
				//	This piece is attacked and defended, which means an exchange (possibly a sequence
				//	of exchanges) is possible on this square. Create exchange object to be evaluated later.
					exchanges.push({
						'piece': piece,
						'attackers': attacked[piece.square][enemy],
						'defenders': attacked[piece.square][piece.color]
					});
				} else {
				//	This piece is hanging, it's attacked and not defended.
					hanging.push(piece);
				}
			});

			return sign[color] * value;
		}

		function evaluateExchange(exchange) {
		//	Returns expected outcome of exchanges at position occupied by given piece.
		//	Exchanges are evaluated with optimal captures for both sides (always try to capture
		//	a piece with the least valuable piece first, in case of enemy recapture).
		// 	exchange: {
		//		piece:     		piece object under attack
		//		attackers: 		array of attacking piece types, sorted increasingly
		// 		          		pawn, knight, rook, pawn == [1, 1, 2, 5]
		//		defenders: 		array of defending pieces, similar to above
		//	}
			var value = 0;

			for (;;) {
				nextAttacker = exchange.attackers.shift();
			}
			return value;
		}

		function evaluateActivity(color) {
			var value = 0;
			pieces[color].forEach(function(piece) { value += activity[piece.code][piece.square] || 0; });
			return sign[color] * value;
		}

		function evaluateDevelopment(color) {
		//	Apply penalty for light pieces staying on the first rank.
			var firstRank = color ? 7 : 0,
				value = 0;
			pieces[color].filter(function(piece) { return piece.isLight; }).forEach(function(piece) {
				if (piece.square.rank === firstRank) {
					value -= 4;
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

		//	Apply penalty when the king is checked.
		//	Double check is particularly dangerous!
			switch (_.size(king.checks)) {
				case 0: 	break;
				case 1: 	value -= 5; break;
				default: 	value -= 25;
			}

		//	Count defenders, attackers and empty squares around the king (within 1 square distance).
		//	The more defenders the better. Every empty square except for first two also decrease safety.
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
			value += evaluateAttacked(color);
			value += evaluateActivity(color);
			value += evaluateDevelopment(color);
			value += evaluateKingSafety(color);
		});

	/*
	//	Modifiers for attacked pieces.
	//	For every piece check whether it is attacked.
	//	If so, look for defending pieces. Compare captured / recaptured piece values.
	//	If not sufficiently defended, treat piece as hanging and decrease the evaluation.
		hangingPiecesWhite = [];
		hangingPiecesBlack = [];

		for (var i = 0; i < piecesWhite.length; i++) {
			square = piecesWhite[i].square;
			if (attacked[square][1].length) {
			//	This piece is under attack.
				if (!attacked[square][0].length) {
				//	This piece is hanging.
					//value -= hangingModifier * piecesWhite[i].points;
					hangingPiecesWhite.push(piecesWhite[i].points);
				} else {
				//	This piece is defended.
					leastValuableAttacker = _.min(attacked[square][1]);
					if (getPieceValue(leastValuableAttacker) < piecesWhite[i].points) {
						//value -= hangingModifier * (piecesWhite[i].points - getPieceValue(leastValuableAttacker));
						hangingPiecesWhite.push(piecesWhite[i].points - getPieceValue(leastValuableAttacker));
					}
				}
			}
		}
		for (var i = 0; i < piecesBlack.length; i++) {
			square = piecesBlack[i].square;
			if (attacked[square][0].length) {
			//	This piece is under attack.
				if (!attacked[square][1].length) {
				//	This piece is hanging.
					//value += hangingModifier * piecesBlack[i].points;
					hangingPiecesBlack.push(piecesBlack[i].points);
				} else {
				//	This piece is defended.
					leastValuableAttacker = _.min(attacked[square][0]);
					if (getPieceValue(leastValuableAttacker) < piecesBlack[i].points) {
						//value += hangingModifier * (piecesBlack[i].points - getPieceValue(leastValuableAttacker));
						hangingPiecesBlack.push(piecesBlack[i].points - getPieceValue(leastValuableAttacker));
					}
				}
			}
		}

	//	Penalty for hanging pieces.
		hangingPiecesWhite = hangingPiecesWhite.sort(function(x, y) { return y - x; });
		hangingPiecesBlack = hangingPiecesBlack.sort(function(x, y) { return y - x; });
		if (position.activeColor === 0) {
		//	It's white's turn to play, so he has the chance to save the most valuable hanging piece.
		//	Remaining attacked pieces count as hanging.
			if (hangingPiecesWhite.length) {
				value -= firstHangingModifier * hangingPiecesWhite[0];
				if (hangingPiecesWhite.length > 1) {
					value -= hangingModifier * hangingPiecesWhite.slice(1).reduce(function(x, y) { 
						return x + (+y);
					});
				}
			}
			if (hangingPiecesBlack.length) {
				value += hangingModifier * hangingPiecesBlack.reduce(function(x, y) { 
					return x + (+y);
				});
			}			
			
		} else {

			if (hangingPiecesBlack.length) {
				value -= firstHangingModifier * hangingPiecesBlack[0];
				if (hangingPiecesBlack.length > 1) {
					value -= hangingModifier * hangingPiecesBlack.slice(1).reduce(function(x, y) { 
						return x + (+y);
					});
				}
			}
			if (hangingPiecesWhite.length) {
				value += hangingModifier * hangingPiecesWhite.reduce(function(x, y) { 
					return x + (+y);
				});
			}

		}
	*/
		return value;
	}

	engine.tree = tree;
	T = tree;
	return engine;
});
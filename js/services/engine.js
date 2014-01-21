'use strict';

app.factory('engine', function(rules, game) {
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
	var tree = {}, _node = {}, maxDepth = 2;


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
				console.debug('Grown nodes:', nodes);
				console.log('%cExpanded tree...', LOG.attention, this);
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
				console.debug('Analyzed nodes:', nodes);
				console.log('%cTree root value:', LOG.state, this.root.value);
			}
		},
		'getMove': {
			value: function(position) {				
				var childNodes, node, move;

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

				console.debug('Best move:', node.move, node.value);
				return node.move; 
			}
		}
	});

	function evaluation(position) {
		console.assert(position.fen.match(rules.validFen), 'Invalid position.', position);
	//	Evaluate position. Return computed value.
		return _.sample(_.range(20));
	/*
		var 
			pieces = position.pieceLists,
			piecesWhite = pieces[0],
			piecesBlack = pieces[1],
			pawnsWhite = pieces.filter(17),
			pawnsBlack = pieces.filter(25),
			knightsWhite = pieces.filter(18),
			knightsBlack = pieces.filter(26),
			kingWhite = pieces.filter(19),
			kingBlack = pieces.filter(27),
			lightPiecesWhite = pieces[0].filter(function(piece) { return !!piece.isLight; }),
			lightPiecesBlack = pieces[1].filter(function(piece) { return !!piece.isLight; }),
			value = 0;

	//	Count the material.
		for (var i = 0; i < piecesWhite.length; i++) {
			value += piecesWhite[i].points;
		}
		for (var i = 0; i < piecesBlack.length; i++) {
			value -= piecesBlack[i].points;
		}

	//	Evaluate pawn activity.
		for (var i = 0; i < pawnsWhite.length; i++) {
			value += rules.ACTIVITY[17][pawnsWhite[i].square];
		}
		for (var i = 0; i < pawnsBlack.length; i++) {
			value -= rules.ACTIVITY[25][pawnsBlack[i].square];
		}

	//	Piece activity.
		for (var i = 0; i < knightsWhite.length; i++) {
			value += rules.ACTIVITY[18][knightsWhite[i].square];
		}
		for (var i = 0; i < knightsBlack.length; i++) {
			value -= rules.ACTIVITY[26][knightsBlack[i].square];
		}

	//	Apply penalty for light pieces on the first rank.
		for (var i = 0; i < lightPiecesWhite.length; i++) {
			if (lightPiecesWhite[i].square.rank === 0) {
				value -= 5;
			}
		}
		for (var i = 0; i < lightPiecesBlack.length; i++) {
			if (lightPiecesBlack[i].square.rank === 7) {
				value += 5;
			}
		}

	//	King safety.

		console.log('%cEvaluating position...', LOG.action, value);
		return value;
	*/
	}

	engine.tree = tree;
	T = tree;
	return engine;
});
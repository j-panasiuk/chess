'use strict';

app.factory('engine', function(rules, game) {
	console.log('%cCreating engine...', LOG.action);
	var engine = {};
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
		'isLeaf': 		{ get: function() { return this.depth === maxDepth; } },
		'isMax': 		{ get: function() { return !(this.depth % 2); } },
		'isMin': 		{ get: function() { return !!(this.depth % 2); } },
		'ramify': {
			value: function() {
				var childNodes,
					self = this;

				if (_.isArray(this.children)) {
					console.log('%cThis node is already branched.', LOG.warn, node);
					return;
				}
				console.debug(self.position.moves.length);
				childNodes = this.position.moves.map(function(move) {
					return createNode(self.position.yields(move), move, self);
				});
				//.map(function(position) {
				//	return createNode(position, self);
				//});
				this.children = childNodes;
				console.log('%cTree node has ramified:', LOG.attention, this.children);
			}
		}
	});

	function createNode(position, move, parentNode) {
		console.assert(position.fen.match(rules.validFen), 'Invalid position.', position);
		console.assert(_node.isPrototypeOf(parentNode) || (parentNode === undefined), 'Invalid parent node.', parentNode);
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
		//node.evaluate = node.isLeaf ? evaluate : acquire;
		Object.defineProperty(node, 'evaluate', {
			value: function() {
				var childValues;
				if (this.isLeaf) {
					this.value = getEvaluation(this.position);
				} else {
					childValues = this.children.map(function(node) { return node.value; });
					this.value = this.isMax ? _.max(childValues) : _.min(childValues);
				}
				console.log('%cEvaluating node...', LOG.action, this.value);
			}
		});

		return node;
	}

	function getEvaluation(position) {
		console.assert(position.fen.match(rules.validFen), 'Invalid position.', position);
	//	Evaluate position. Return computed value.
		var 
			pieces = position.pieceLists,
			piecesWhite = pieces[0],
			piecesBlack = pieces[1],
			pawnsWhite = pieces.filter(17),
			pawnsBlack = pieces.filter(25),
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

	//	Pinned pieces.

		console.log('%cEvaluating position...', LOG.action, value);
		return value;
	}

//	Define game tree.
	Object.defineProperties(tree, {
		'root': { value: null, writable: true, configurable: true, enumerable: true },
		'branch': { value: [], writable: true, configurable: true, enumerable: true },
		'plant': { 
			value: function plantTree(position) {
				console.log('%cPlanting game tree...', LOG.action);
				this.root = createNode(position);
				this.branch = [this.root];
			} 
		},
		'expand': {
			value: function expandBranch() {
				console.log('%cExpanding game tree...', LOG.action);
				var currentDepth = this.branch.length - 1;

				this.branch[currentDepth].ramify();
				console.log('%cExpanded tree...', LOG.attention, this);
			}
		},
		'analyze': {
			value: function analyzeLeaves() {
				var childNode;
				for (var i = 0; i < this.root.children.length; i++) {
					childNode = this.root.children[i];
					childNode.evaluate();
				}
				console.log('%cAnalyzing root value...', LOG.action);
				this.root.evaluate();
				console.log('%cRoot value:', LOG.state, this.root.value);
			}
		},
		'getMove': {
			value: function(position) {
				console.time('Compute move');
				var childNodes, node, move;

			//	Reset game tree to current position.
				this.plant(position);

			//	Branch out the tree up to given depth.
				this.expand();

			//	Assign values to all tree nodes.
				this.analyze();

			//	Sort best available moves, based on computed values.
				childNodes = this.root.children;
				childNodes = _.sortBy(childNodes, 'value');

			//	Select highest or lowest valued move, depending on color.
				node = game.activeColor ? _.first(childNodes) : _.last(childNodes);

				console.timeEnd('Compute move');
				console.log('%cBest move:', LOG.attention, node.move.san);
				return node.move; 
			}
		}
	});

	engine.tree = tree;
	T = tree;
	return engine;
});
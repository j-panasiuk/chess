'use strict';

app.factory('engine', function(rules, game) {
	console.log('%cCreating engine...', LOG.action);
	var engine = {};
//	Declare local variables.
	var tree = {}, _node = {}, maxDepth = 1;

	Object.defineProperties(_node, {
		'position': { writable: true, configurable: true, enumerable: true },
		'depth': { writable: true, configurable: true, enumerable: true },
		'parent': { writable: true, configurable: true, enumerable: true },
		'children': { writable: true, configurable: true, enumerable: true },
		'isRoot': { get: function() { return this.depth === 0; } },
		'isLeaf': { get: function() { return this.depth === maxDepth; } },
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
					return self.position.yields(move);
				}).map(function(position) {
					return createNode(position, self);
				});
				this.children = childNodes;
				console.log('%cTree node has ramified:', LOG.attention, this.children);
			}
		}
	});

	function createNode(position, parentNode) {
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
		node.parent = parentNode || null;
		node.depth = parentNode ? parentNode.depth + 1 : 0;
		node.children = null;

		return node;
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
		}
	});

	engine.tree = tree;
	T = tree;
	return engine;
});
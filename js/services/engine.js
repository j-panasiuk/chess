'use strict';

app.factory('engine', function(rules, game) {
	console.log('%cCreating engine...', LOG.action);
	var engine = {};
//	Declare local variables.
	var tree = {}, _node = {};

	Object.defineProperties(_node, {

	});

//	Define game tree.
	Object.defineProperties(tree, {
		'root': { value: null, writable: true, configurable: true, enumerable: true },
		//'branch': [root, node, node, leaf]
		'plant': { 
			value: function(position) {
				console.log('%cPlanting game tree...', LOG.action);
				this.root = position;
			} 
		},
		'expand': {
		//	Branch out from each leaf. 
		//	`depth` specifies number of iterations (by default 1).
			value: function(depth) {

			}
		}
	});

	engine.tree = tree;
	return engine;
});
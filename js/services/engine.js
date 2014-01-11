'use strict';

app.factory('engine', function(rules, game) {
	console.log('%cCreating engine...', LOG.action);
	var engine = {};
//	Declare local variables.
	var tree = {};

//	Define game tree.
	Object.defineProperties(tree, {
		'root': { value: null, writable: true, configurable: true, enumerable: true },
		'plant': { 
			value: function(position) {
				console.log('%cPlanting game tree...', LOG.action);
				this.root = position;
			} 
		}
	});

	engine.tree = tree;
	return engine;
});
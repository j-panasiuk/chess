'use strict';

//	Define settings for game rules.
//	Set default values.
app.factory('settings', function() {
	console.log('%cCreating settings...', "color:DarkViolet");
	var defaults, settings;

	//(function createControlFlags() {
	//	var CONTROL_FLAGS = {
	//		'none': 0,
	//		'user': 1,
	//		'ai': 2
	//	}
	//	chess.CONTROL_FLAGS = CONTROL_FLAGS;
	//	Object.freeze(CONTROL_FLAGS);
	//	console.log('%cCreating control flags...', "color:DarkViolet");
	//}());

	defaults = {
		'fen': "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		'controlWhite': 1, //chess.CONTROL_FLAGS.user,
		'controlBlack': 2, //chess.CONTROL_FLAGS.ai,
		'difficulty': 0,
		'mode': 0,
		'timeLimit': 0,
		'isReversed': false,
		'debug': 0,
		'animationTime': 300
	};
	Object.freeze(defaults);

//	Create settings based on `defaults` keys and values.
//	Settings can be modified later.
	settings = {};
	for (var property in defaults) {
		settings[property] = defaults[property];
	}

	console.log('`settings` service ready.');
	return settings;
});
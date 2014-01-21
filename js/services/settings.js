'use strict';

//	Define settings for game rules.
//	Set default values.
app.factory('settings', function() {
	console.log('%cCreating settings...', LOG.action);
	var defaults, settings;

	defaults = {
		'fen': "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		'controlWhite': 1, 		// User
		'controlBlack': 2,		// AI
		'difficulty': 0,
		'mode': 0,
		'timeLimit': 0,
		'isReversed': false,
		'reverseForBlack': true,
		'debugMode': true,
		'animationTime': 250,
		'delayAI': 500
	};
	Object.freeze(defaults);

//	Create settings based on `defaults` keys and values.
//	Settings can be modified later.
	settings = {};
	for (var property in defaults) {
		settings[property] = defaults[property];
	}

//	Create flags to mark control of each color.
	settings.CONTROL_FLAGS = {
		'none': 0,
		'user': 1,
		'ai': 2
	};
	Object.freeze(settings.CONTROL_FLAGS);

//	Create settings for Debug UI.
	settings.debug = {
		'displaySubscripts': true,
		'displayOutlines': true
		//'displayAttacked': false
	};

	return settings;
});
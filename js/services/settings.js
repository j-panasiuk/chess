'use strict';

//	Define settings for game rules.
//	Set default values.
app.factory('settings', function() {
	console.log('%cCreating settings...', LOG.action);
	var defaults, ui, settings;

	defaults = {
		//'fen': "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        'fen': "n6k/PP6/2P5/8/8/7p/7p/KRR5 w - - 0 1",
		'controlWhite': 1, 		// User
		'controlBlack': 2,		// AI
		'difficulty': 0,
		'mode': 0,
		'timeLimit': 0,
		'isReversed': false,
		'reverseForBlack': true,
        'autoRestart': true,
		'switchColorOnRestart': true,
		'debugMode': false,
		'animationTime': 400,
		'delayAI': 500,
        'showMoveList': true,
        'showMoveEvaluation': false
	};
    Object.freeze(defaults);

//	Create settings based on `defaults` keys and values.
//	Settings can be modified later.
	settings = {};
	for (var property in defaults) {
		settings[property] = defaults[property];
	}

//  Set editable properties (displayed in UI options).
    ui = {};
    Object.defineProperties(ui, {
        'fen': {},
        'controlWhite': { 
            enumerable: true, 
            value: {
                name: 'controlWhite',
                label: 'White player',
                type: 'select',
                options: [
                    { label: 'User', value: 1 }, 
                    { label: 'AI', value: 2}
                ]
            } 
        },
        'controlBlack': { 
            enumerable: true, 
            value: {
                name: 'controlBlack',
                label: 'Black player',
                type: 'select',
                options: [
                    { label: 'User', value: 1 }, 
                    { label: 'AI', value: 2}
                ]
            } 
        },
        'difficulty': { 
            enumerable: true, 
            value: {
                name: 'difficulty',
                label: 'Difficulty',
                type: 'select',
                options: [
                    { label: 'Dizzy', value: 0 }, 
                    { label: 'Dazed', value: 1 },
                    { label: 'Confused', value: 2 }
                ]
            }
        },
        'mode': {},
        'timeLimit': {},
        'isReversed': {},
        'reverseForBlack': { 
            enumerable: true, 
            value: {
                name: 'reverseForBlack',
                label: 'Reverse chessboard',
                type: 'checkbox'
            }
        },
        'autoRestart': { 
            enumerable: true, 
            value: {
                name: 'autoRestart',
                label: 'Automatic game restart',
                type: 'checkbox'
            } 
        },
        'switchColorOnRestart': { 
            enumerable: true, 
            value: {
                name: 'switchColorOnRestart',
                label: 'Switch sides on restart',
                type: 'checkbox'
            } 
        },
        'debugMode': { 
            enumerable: true, 
            value: {
                name: 'debugMode',
                label: 'Debug mode',
                type: 'checkbox'
            } 
        },
        'animationTime': { 
            enumerable: true, 
            value: {
                name: 'animationTime',
                label: 'Animations',
                type: 'checkbox'
            }
        },
        'delayAI': {},
        'showMoveList': { 
            enumerable: true, 
            value: {
                name: 'showMoveList',
                label: 'Move list',
                type: 'checkbox'
            } 
        },
        'showMoveEvaluation': { 
            enumerable: true, 
            value: {
                name: 'showMoveEvaluation',
                label: 'Move evaluation',
                type: 'checkbox'
            } 
        }
    });
    Object.freeze(ui);
    settings.ui = ui;

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

	function switchControls() {
		var t = +(settings.controlWhite);
		settings.controlWhite = +(settings.controlBlack);
		settings.controlBlack = t;
	}
	settings.switchControls = switchControls;

	return settings;
});
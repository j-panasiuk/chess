'use strict';
var S;

//	Define settings for game rules.
//	Set default values.
app.factory('settings', function() {
	console.log('%cCreating settings...', LOG.action);
    var settings = {};

//  DEFINE _setting
//  DEFINE _settingList
//
//  CREATE defaults
//  CREATE settings = CLONE(defaults)
//  FREEZE(defaults)
//
//  settings.UPDATE(localStorage)
//
//  RETURN

    var defaultSettings,
        currentSettings,
        keywords;

    defaultSettings = [

        { 
            id: 'fen',
            value: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 
            keywords: ['advanced'], 
            label: 'Starting position',
            input: 'text'
        },

        { 
            id: 'controlWhite', 
            value: 1,
            options: {
                'None': 0,
                'User': 1,
                'AI': 2
            },
            keywords: ['gameplay'], 
            label: 'White player',
            input: 'select'
        },

        { 
            id: 'controlBlack', 
            value: 2,
            options: {
                'None': 0,
                'User': 1,
                'AI': 2
            },
            keywords: ['gameplay'], 
            label: 'Black player',
            input: 'select'
        },

        { 
            id: 'autoRestart',  
            value: false,
            options: [true, false],
            keywords: ['gameplay'], 
            label: 'Automatic game restart',
            input: 'checkbox'
        },

        { 
            id: 'switchColorOnRestart',  
            value: true,
            options: [true, false],
            keywords: ['gameplay'], 
            label: 'Switch colors on restart',
            input: 'checkbox' 
        },

        { 
            id: 'isReversed',  
            value: false,
            options: [true, false],
            keywords: ['chessboard'], 
            label: 'Flip chessboard',
            input: 'checkbox' 
        },

        { 
            id: 'reverseForBlack',  
            value: true,
            options: [true, false],
            keywords: ['chessboard'], 
            label: 'Flip chessboard for black',
            input: 'checkbox' 
        },

        { 
            id: 'animationTime',  
            value: 400,
            options: [0, 250, 400],
            keywords: ['chessboard'], 
            label: 'Animation time',
            input: 'select' 
        },

        { 
            id: 'highlightChecks',  
            value: true,
            options: [true, false],
            keywords: ['chessboard'], 
            label: 'Highlight checks',
            input: 'checkbox' 
        },

        { 
            id: 'highlightLastMove',  
            value: true,
            options: [true, false],
            keywords: ['chessboard'], 
            label: 'Highlight last move',
            input: 'checkbox'
        },

        { 
            id: 'moveList',  
            value: true,
            options: [true, false],
            keywords: ['tool'], 
            label: 'Show move list',
            input: 'checkbox' 
        },

        { 
            id: 'moveEvaluation',  
            value: false,
            options: [true, false],
            keywords: ['tool'], 
            label: 'Show move evaluation',
            input: 'checkbox'
        }

    ];

    keywords = defaultSettings.map(function(setting) {
        return setting.keywords;
    }).reduce(function(a, b) {
        return _.union(a, b);
    });

    defaultSettings = _.indexBy(defaultSettings, 'id');
    currentSettings = clone(defaultSettings);
    Object.freeze(defaultSettings);
    settings.defaultSettings = defaultSettings;
    settings.currentSettings = currentSettings;


    _.forEach(currentSettings, function(setting) {
        Object.defineProperty(settings, ''+setting.id, {
            get: function() { return setting.value; },
            set: function(value) { setting.value = value; }
        });        
    });

    _.forEach(keywords, function(keyword) {
        Object.defineProperty(settings, ''+keyword, {
            get: function() {
                return _.filter(currentSettings, function(setting) { 
                    return _.contains(setting.keywords, keyword); 
                });
            }
        });
    });

    Object.defineProperty(settings, 'all', {
        get: function() {
            return _.values(currentSettings);
        }
    });

    Object.defineProperty(settings, 'reset', {
        value: function(keyword) {

            if (keyword) {
            //  Reset all settings, which contain given keyword.
                for (var id in defaultSettings) {
                    if (_.contains(defaultSettings[id].keywords, keyword)) {
                        console.log('%cReset', LOG.action, keyword, ':', id);
                        this[id] = defaultSettings[id].value;
                    }
                }

            } else {
            //  Reset all settings to default.
                for (var id in defaultSettings) {
                    this[id] = defaultSettings[id].value;
                }
            }
        }
    });

//	Create flags to mark control of each color.
	settings.CONTROL_FLAGS = {
		'none': 0,
		'user': 1,
		'ai': 2
	};
	Object.freeze(settings.CONTROL_FLAGS);

	function switchControls() {
		var t = +(settings.controlWhite);
		settings.controlWhite = +(settings.controlBlack);
		settings.controlBlack = t;
	}
	settings.switchControls = switchControls;

    function clone(o) {
    //  Create shallow copy of an object.
    //  Use to create an independent duplicate (without reference to original object)
        return JSON.parse(JSON.stringify(o));
    }

    S = settings;
	return settings;
});
app.directive('status', function(game) {
    'use strict';
    var RESULT, ACTION;
    RESULT = {};                    ACTION = {};
    RESULT[1] = 'Game drawn';       ACTION[0] = 'White to move';
    RESULT[2] = 'White wins';       ACTION[1] = 'Black to move';
    RESULT[3] = 'Black wins';
    Object.freeze(RESULT);
    Object.freeze(ACTION);

    return {
        restrict: 'A',
        replace: false,
        scope: true,
        controller: function() {},
        link: function(scope, element) {
            scope.game = game;
            scope.currentState = function() {
                if (!scope.game.started) {
                    return 'Game ready';
                } else {
                    return scope.game.result ? RESULT[scope.game.result] : ACTION[scope.game.activePlayer.color];
                }
            };
        }
    };
});

app.directive('movelist', function(settings, game) {
    'use strict';
    return {
        restrict: 'A',
        replace: false,
        scope: true,
        controller: function() {},
        link: function(scope, element) {
            var content = element[0].getElementsByClassName('panel-body')[0];

            scope.settings = settings;
            scope.game = game;

            scope.scroll = function() {
                console.log('%cScrolling movelist', LOG.ui);
                content.scrollTop = 50000;              
            };

        //  Keep movelist scrolled to the bottom, so that the last move stays visible.
            scope.$watch(function() {
                return scope.game.history.move;
            }, function() {
                scope.scroll();
            });
        }
    };
});
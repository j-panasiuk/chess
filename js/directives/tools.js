var content;

app.directive('movelist', function(settings, game) {
    return {
        restrict: 'A',
        replace: false,
        scope: true,
        controller: function() {},
        link: function(scope, element) {
            content = element[0].getElementsByClassName('panel-body')[0];

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
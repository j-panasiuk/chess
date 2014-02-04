'use strict';

app.directive('chessboard', function(settings, rules, game) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'template-chessboard.html',
        scope: true,
        link: function(scope) {
            scope.settings = settings;
            scope.rules = rules;
            scope.game = game;        
        }
    };
});

app.directive('square', function(settings, game) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'template-square.html',
        scope: {
            square: '=square',
            isSelectable: '=selectable',
            state: '=state'
        },
        link: function(scope) {
            scope.settings = settings;
            scope.game = game;
            scope.square = +scope.square;

            scope.select = function handleSquareClick() {
                if (scope.isSelectable) {
                    scope.$parent.handleSquareSelect(scope.square);
                }
            };
        }
    };
});

app.directive('piece', function(settings, rules) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'template-piece.html',
        scope: {
            piece: '=ngModel',
            isSelectable: '=selectable',
            isSelected: '=selected'
        },
        link: function(scope) {
            scope.settings = settings;
            scope.color = rules.COLOR_NAME[scope.piece.color];

            scope.select = function handlePieceClick() {
                if (scope.isSelectable) {
                    scope.$parent.handlePieceSelect(scope.piece);
                } else if (scope.$parent.isSelectableSquare(scope.piece.square)) {
                    scope.$parent.handleSquareSelect(scope.piece.square);
                }                
            };
        }
    };
});
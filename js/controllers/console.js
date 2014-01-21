'use strict';

app.controller('consoleController', function($scope, settings, rules, game, engine) {
    $scope.settings = settings;
    $scope.rules = rules;
    $scope.game = game;
    $scope.engine = engine;

    $scope.max = 200;

    $scope.random = function() {
        console.log('Random!');
        var value = Math.floor((Math.random() * 100) + 1);
        $scope.dynamic = value;
    };

    $scope.random();
});
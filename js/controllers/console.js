'use strict';

app.controller('consoleController', function($scope, settings, rules, game, engine) {
    $scope.settings = settings;
    $scope.rules = rules;
    $scope.game = game;
    $scope.engine = engine;
});
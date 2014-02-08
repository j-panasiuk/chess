'use strict';

app.controller('mainController', function($scope, $timeout, settings, rules, game, engine) {
    console.log('%cLoading mainController...', LOG.action);

    $scope.settings = settings;
    $scope.rules = rules;
    $scope.game = game;
    $scope.engine = engine;

    $scope.keypress = function(evt) {
        console.log('%cKey pressed:', LOG.ui, evt.keyCode);
        switch (evt.keyCode) {
            case 32:     $scope.cancel(); break;
            case 13:     $scope.$broadcast('confirm'); break;
        }
    };

    $scope.cancel = function() {
        $scope.$broadcast('cancel');
    }

    $scope.debug = function() {
    //  Toggle debug interface visibilty.
        settings.debugMode = !settings.debugMode;
    };

    $scope.reverse = function() {
    //  Flip the chessboard. Positions of squares and pieces will adjust to match settings.isReversed,
    //  by watching changes on class `reversed-{{settings.isReversed}}`.
        settings.isReversed = !settings.isReversed;
    };

    $scope.moveList = function() {
    //  Toggle move list widget.
        settings.moveList = !settings.moveList;
    }

    $scope.moveEvaluation = function() {
    //  Toggle move evaluation widget.
        settings.moveEvaluation = !settings.moveEvaluation;
    }

    $scope.startGame = function(restart) {
        console.log('%c\nSTART GAME\n', LOG.action);
    //  restart == false: Start first game. Game model is already up-to-date.
    //  restart == true: Restart game with current settings. Model update needed.
        if (restart) {
        //  Depending on current settings, switch colors / reverse chessboard.
            if (settings.switchColorOnRestart) {
                settings.switchControls();
                console.log('%cSwitching sides...', LOG.action, settings);
            }
            game.initialize();
            console.log('%cSetting up starting position...', LOG.action, game.currentPosition);
        }            
        $scope.$broadcast('startGame', !!restart);
    };

    $scope.$on('gameOver', function(event, result) {
        console.log('%cGame Over:', LOG.attention, result);
        if ($scope.settings.autoRestart) {
            $timeout(function() {
                $scope.startGame(true);
            }, 500);
        }
    });

//  Initialize first game.
    $timeout(function initialize() {
        $scope.startGame(false);
    }, 100);


});

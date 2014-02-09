'use strict';

app.controller('mainController', function($scope, $timeout, settings, rules, game, engine) {
    console.log('%cLoading mainController...', LOG.action);

    $scope.settings = settings;
    $scope.rules = rules;
    $scope.game = game;
    $scope.engine = engine;

    $scope.currentState = function() {
        var RESULT, ACTION;
        RESULT = {};                    ACTION = {};
        RESULT[1] = 'Game drawn';      ACTION[0] = 'White to move';
        RESULT[2] = 'White wins';      ACTION[1] = 'Black to move';
        RESULT[3] = 'Black wins';

        if (!$scope.game.started) {
            return 'Game ready.';
        } else {
            return $scope.game.result ? RESULT[$scope.game.result] : ACTION[$scope.game.activePlayer.color];
        }
    };

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

    $scope.$on('newGameConfirmed', function() {
        $scope.startGame(true);
    });

//  Initialize first game.
    $timeout(function initialize() {
        $scope.startGame(false);
    }, 100);


});

app.controller('optionsModalController', function($scope, $modal, settings) {

    $scope.settings = settings;
    $scope.options = _.values($scope.settings.all);

    $scope.open = function() {
        var modalInstance = $modal.open({
            templateUrl: 'options-modal.html',
            controller: modalInstanceController,
            resolve: {
                options: function() {
                    return $scope.options;
                }
            }
        });

        modalInstance.result.then(function() {
        //  Modal confirmed.
        }, function() {
        //  Modal dismissed.
        });
    };

//  Please note that $modalInstance represents a modal window (instance) dependency.
//  It is not the same as the $modal service used above.
    function modalInstanceController($scope, $modalInstance, options, settings) {

        $scope.settings = settings;
        $scope.options = options;  

        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };

        $scope.defaults = function() {
            console.log('%cReset settings', LOG.action);
            $scope.settings.reset();
        };

    }

});


app.controller('newGameModalController', function($scope, $modal, settings) {

    $scope.settings = settings;

    $scope.open = function() {
        var modalInstance = $modal.open({
            templateUrl: 'new-game-modal.html',
            controller: modalInstanceController,
            resolve: {

            }
        });

        modalInstance.result.then(function() {
        //  Modal confirmed.
        }, function() {
        //  Modal dismissed.
        });
    };

//  Please note that $modalInstance represents a modal window (instance) dependency.
//  It is not the same as the $modal service used above.
    function modalInstanceController($scope, $modalInstance, settings) {

        $scope.settings = settings;

        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };

    }

});
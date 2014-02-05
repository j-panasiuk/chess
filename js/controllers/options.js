app.controller('optionsModalController', function($scope, $modal, settings) {

    $scope.settings = settings;
    $scope.options = _.values($scope.settings.ui);

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

    }

});
angular.module('portfolio.controllers', [])

.controller('AppCtrl', function($scope, $location) {

    $scope.logout = function() {
        $location.path('/intro/welcome');
    };

})

.controller('ArtworksCtrl', function($scope, Artworks) {
    $scope.artworks = Artworks.all();
})

.controller('ArtworkDetailsCtrl', function($scope, $stateParams, $ionicModal, Artworks) {
    $scope.artwork = Artworks.findById($stateParams.artId);

    $ionicModal.fromTemplateUrl('templates/artwork-info-popup.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    $scope.displayArtworkInfo = function($event) {
      $scope.modal.show($event);
    };

    $scope.closeArtworkInfo = function() {
      $scope.modal.hide();
    };
})

.controller('IntroCtrl', function($scope) {

});
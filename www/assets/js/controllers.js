angular.module('portfolio.controllers', [])

.controller('AppCtrl', function($scope, $state) {

    $scope.logout = function() {
        $state.go('intro.welcome');
    };

})

.controller('ArtworksCtrl', function($scope, Artworks) {
    $scope.artworks = Artworks.all();
})

.controller('ArtworkDetailsCtrl', function($scope, $state, $stateParams, $ionicModal, $ionicGesture, Artworks) {

    $scope.artwork = Artworks.findById($stateParams.artId);

    $ionicModal.fromTemplateUrl('templates/artwork/modal.html', {
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

    $scope.loadPrev = function() {
      // $scope.artwork = Artworks.findById(Artworks.prevId());
      $state.go('artwork.artwork', {artId: Artworks.prevId()});
    };

    $scope.loadNext = function() {
      // $scope.artwork = Artworks.findById(Artworks.nextId());
      $state.go('artwork.artwork', {artId: Artworks.nextId()});
    };

    $scope.goBack = function() {
      $state.go('portfolio.artworks');
    };

})

.controller('IntroCtrl', function($scope) {

});
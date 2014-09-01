angular.module('portfolio.controllers', [])

.controller('AppController', function($scope, $state, $ionicPopup) {

  $scope.logout = function() {
    $state.go('intro.welcome');
  };

  $scope.submitSubscriber = function() {
    // TODO: Do the subscription logic
    var alertPopup = $ionicPopup.alert({
      title: 'Add subscriber',
      template: 'Thank you for subscription'
    });
  };

})

.controller('ArtworksController', function($scope, $stateParams, ArtworkProvider, CollectionProvider) {
  $scope.viewTitle = 'Artworks';
  $scope.ref = 'artworks';
  $scope.refId = 0;
  if ($stateParams.collectionId) {
    var collection = CollectionProvider.findById($stateParams.collectionId);
    $scope.artworks = ArtworkProvider.allByCollection(collection);
    $scope.viewTitle = collection.name;
    $scope.ref = 'collection';
    $scope.refId = collection.id;
  } else {
    $scope.artworks = ArtworkProvider.all();
  }
})

.controller('CollectionsController', function($scope, CollectionProvider) {
    $scope.collections = CollectionProvider.all();
})

.controller('ArtworkDetailsController', function($scope, $state, $stateParams, $ionicModal, ArtworkIteratorProvider, ArtworkProvider, CollectionProvider) {

  $scope.artwork = ArtworkProvider.findById($stateParams.artId);

  var artworkSet = [];
  if ($stateParams.ref == 'collection') {
    var collection = CollectionProvider.findById($stateParams.refId);
    artworkSet = ArtworkProvider.allByCollection(collection);
  } else {
    artworkSet = ArtworkProvider.all();
  }

  // Handle browsing through multiple artworks within given context
  ArtworkIteratorProvider.init(artworkSet, $stateParams.artId);

  $scope.loadPrev = function() {
    $state.go('artwork.artwork', {artId: ArtworkIteratorProvider.prevId()});
  };

  $scope.loadNext = function() {
    $state.go('artwork.artwork', {artId: ArtworkIteratorProvider.nextId()});
  };

  // Handle "Back" button
  $scope.goBack = function() {
    if ($stateParams.ref == 'collection') {
      $state.go('portfolio.bycollection', {collectionId: $stateParams.refId});
    } else {
      $state.go('portfolio.artworks');
    }
  };

  // Handle modal overlay with artwork details
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

})

.controller('IntroController', function($scope) {

})

.controller('LoginController', function($scope, $state, $ionicPopup, RemoteDataProvider, LocalStorageProvider) {

  // A simple function to handle popup alerts
  var errorAlert = function(message, title) {
    $ionicPopup.alert({
      title: title ? title : 'Oops',
      template: message
    });
  };


  $scope.login = function(user) {
    // Temporary solution used for testing purposes only
    // until proper authorisation solution is in place
    var u = user ? user.email : 'kate-heiss';

    // Fetch artworks and save response to local storage
    RemoteDataProvider.fetchArtworksForUser(u).then(function(data_arts) {
      if (!data_arts.data.objects || data_arts.data.objects.length === 0) {
        errorAlert('It appears that you have no artworks in your portfolio.');
      } else {
        LocalStorageProvider.saveUsername(u);
        LocalStorageProvider.saveRawArtworksData(data_arts.data.objects);

        // Fetch collections and save response to local storate
        RemoteDataProvider.fetchCollectionsForUser(u).then(function(data_cols){
          if (data_cols.data.objects && data_cols.data.objects.length > 0) {
            LocalStorageProvider.saveRawCollectionsData(data_cols.data.objects);
          }

          // Redirect to intro.fetch view to begin artwork/collections fetching
          $state.go('intro.fetch');
        });
      }
    }, function(err){
      errorAlert(err, 'Unexpected error');
    });
  };
})

.controller('FetcherController', function($scope, $state, LocalStorageProvider, RemoteDataProvider) {

  var rawArts = JSON.parse(LocalStorageProvider.getRawArtworksData());
  var numOfArtworks = rawArts.length;
  var artworks = [];

  // Helper method to update progress status
  var updateStatus = function(count) {
    $scope.statusTxt = count + '/' + numOfArtworks;
  };

  // Recursive function to fetch binary images and save in persistent storage
  var fetchAndSave = function(artIdx, imgIdx) {

    console.log(artIdx, imgIdx);

    if (rawArts[artIdx] && rawArts[artIdx].images.length > 0) {
      updateStatus(artIdx+1);
      var img = rawArts[artIdx].images[imgIdx];
      RemoteDataProvider.fetchBlob(img.grid_medium.url).then(function(data){
        console.log('save grid_medium ' + artIdx + '-' + imgIdx);
        // rawArts[artIdx].images[imgIdx].grid_medium.local_path = 'grid_medium.jpg';

        RemoteDataProvider.fetchBlob(img.fluid_large.url).then(function(data){
          console.log('save fluid_large ' + artIdx + '-' + imgIdx);

          RemoteDataProvider.fetchBlob(img.fluid_medium.url).then(function(data){
            console.log('save fluid_medium ' + artIdx + '-' + imgIdx);

            RemoteDataProvider.fetchBlob(img.fluid_small.url).then(function(data){
              console.log('save fluid_small ' + artIdx + '-' + imgIdx);
              if (rawArts[artIdx].images.length-1 > imgIdx) {
                fetchAndSave(artIdx, imgIdx+1);
              } else {
                fetchAndSave(artIdx+1, 0);
              }
            });
          });
        });
      });

      // RemoteDataProvider.fetchBlob(rawArts[artIdx].images[imgIdx].grid_medium.url).then(function(data){
      //   console.log('save data');
      //   if (rawArts[artIdx].images.length-1 > imgIdx) {
      //     fetchAndSave(artIdx, imgIdx+1);
      //   } else {
      //     // updateStatus(artIdx+1);
      //     // if (rawArts.length-1 > artIdx) fetchAndSave(artIdx+1, 0);
      //     fetchAndSave(artIdx+1, 0);
      //   }
      // });
    }

  };

  fetchAndSave(0, 0);
  // console.log(rawArts);

});
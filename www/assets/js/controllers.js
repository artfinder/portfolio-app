angular.module('portfolio.controllers', [])

/**
 * Generic application controller
 */
.controller('AppController', function($scope, $state, $ionicPopup, LocalStorageProvider, PersistentStorageProvider) {

  $scope.logout = function() {
    $ionicPopup.confirm({
      title: 'Logout',
      template: 'Logging out will remove all artworks from your device. Are you sure?'
    }).then(function(response) {
      if (response) {
        PersistentStorageProvider.purge(function(){
          LocalStorageProvider.purge();
          $state.go('intro.welcome');
        });
      }
    });

  };

  $scope.submitSubscriber = function() {
    // TODO: Implement the subscription logic
    var alertPopup = $ionicPopup.alert({
      title: 'Add subscriber',
      template: 'Thank you for subscription'
    });
  };

})

/**
 * Handles artworks listing
 */
.controller('ArtworksController', function($scope, $stateParams, ArtworkProvider, CollectionProvider) {
  $scope.viewTitle = 'Artworks';
  $scope.ref = 'artworks';
  $scope.refId = 0;

  // Display artworks that belong to collection...
  if ($stateParams.collectionId) {
    var collection = CollectionProvider.findById($stateParams.collectionId);
    $scope.artworks = ArtworkProvider.allByCollection(collection);
    $scope.viewTitle = collection.name;
    $scope.ref = 'collection';
    $scope.refId = collection.id;

  // ...or display them all
  } else {
    $scope.artworks = ArtworkProvider.all();
  }
})

/**
 * Handles collections listing
 */
.controller('CollectionsController', function($scope, CollectionProvider) {
    $scope.collections = CollectionProvider.all();
})

/**
 * A single artwork view controller
 */
.controller('ArtworkDetailsController', function($scope, $state, $stateParams, $ionicModal, ArtworkIteratorProvider, ArtworkProvider, CollectionProvider) {

  $scope.artwork = ArtworkProvider.findById($stateParams.artId);

  // Define artwork set to help browsing
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

  // Handle "Back" button depending whether we're in collections or artworks context
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

  $scope.shareArtwork = function(artworkUrl) {
    window.plugins.socialsharing.share('Hi there, check out my artwork!', null, artworkUrl, 'http://www.artfinder.com');
  };

})

.controller('IntroController', function($scope) {

})

/**
 * Controller which handles initial user login action
 * - fetches json data from webservice
 * - saves data into local storage
 * - redirects to the next step (FetcherController)
 */
.controller('LoginController', function($scope, $state, $ionicPopup, $ionicLoading, RemoteDataProvider, LocalStorageProvider) {

  // A simple function to handle errors using friendly popup message
  var alertPopup = function(message, title) {
    $ionicPopup.alert({
      title: title ? title : 'Oops',
      template: message,
      onTap: $ionicLoading.hide()
    });
  };

  $scope.login = function(user) {

    var u = user ? user.slug : null;
    if (!u) {
      return alertPopup('Please provide username/slug');
    }

    $ionicLoading.show({
      template: 'Logging in...'
    });

    // Fetch artworks and save response to local storage
    RemoteDataProvider.fetchArtworksForUser(u).then(function(data_arts) {
      if (!data_arts.data.objects || data_arts.data.objects.length === 0) {
        alertPopup('It appears that you have no artworks in your portfolio.');
      } else {
        LocalStorageProvider.saveUsername(u);
        LocalStorageProvider.saveRawArtworksData(data_arts.data.objects);

        // Fetch collections and save response to local storage
        RemoteDataProvider.fetchCollectionsForUser(u).then(function(data_cols){
          if (data_cols.data.objects && data_cols.data.objects.length > 0) {
            LocalStorageProvider.saveRawCollectionsData(data_cols.data.objects);
          }

          // Redirect to intro.fetch view to begin artwork/collections fetching
          $ionicLoading.hide();
          $state.go('intro.fetch');
        });
      }
    }, function(err){
      alertPopup('An unexpected error occurred while logging in. Perhaps you are not connected to the internet?');
    });
  };
})

/**
 * A controller which handles actual artworks fetching to local persistent storage
 * - reads json data from local storage (saved at the login step)
 * - recursively fetches artworks images and passes to storage service to save locally
 * - updates artworks json dada with paths leading to locally stored images
 */
.controller('FetcherController', function($scope, $state, $ionicLoading, LocalStorageProvider, PersistentStorageProvider, RemoteDataProvider) {

  var rawArts = LocalStorageProvider.getRawArtworksData();
  var numOfArtworks = rawArts.length;
  var username = LocalStorageProvider.getUsername();
  var killswitch = 0;

  // Cancel ongoing, recursive fetch process
  // Sets the killswitch to tell recursive function that process needs to stop
  $scope.cancel = function() {
    killswitch = 1;
    $ionicLoading.show({
      template: 'Aborting dowload process, please wait...'
    });
  };

  // Helper method to update progress status
  var updateStatus = function(count) {
    $scope.statusTxt = count + '/' + numOfArtworks;
  };

  // Helper method to generate filename
  var filename = function(type, artIdx, imgIdx) {
    return username + '-' + type + '-' + artIdx + '-' + imgIdx + '.jpg';
  };

  // Recursive function to fetch binary images and save in persistent storage
  var fetchAndSave = function(artIdx, imgIdx) {

    // Abort execution grecefully when killswitch is on
    if (killswitch > 0) {
      console.log('Aborting - killswitch: ' + killswitch);
      PersistentStorageProvider.purge(function() {
        LocalStorageProvider.purge();
        $ionicLoading.hide();
        $state.go('intro.welcome');
      });
      return;
    }

    if (rawArts[artIdx]) {

      if (rawArts[artIdx].images[imgIdx]) {

        updateStatus(artIdx+1);
        var img = rawArts[artIdx].images[imgIdx];

        // Fetch grid_medium...
        RemoteDataProvider.fetchBlob(img.grid_medium.url).then(function(data){

          // ...save grid_medium to persistent storage.
          console.log('save grid_medium ' + artIdx + '-' + imgIdx + ', data.size: ' + data.data.size);
          PersistentStorageProvider.saveBlob(data.data, filename('grid_medium', artIdx, imgIdx), function(file) {
            rawArts[artIdx].images[imgIdx].grid_medium.local_path = file.toURL();

            // Fetch fluid_large...
            RemoteDataProvider.fetchBlob(img.fluid_large.url).then(function(data) {

              // ...save fluid_large to persistent storage.
              console.log('save fluid_large ' + artIdx + '-' + imgIdx + ', data.size: ' + data.data.size);

              PersistentStorageProvider.saveBlob(data.data, filename('fluid_large', artIdx, imgIdx), function(file) {
                rawArts[artIdx].images[imgIdx].fluid_large.local_path = file.toURL();

                if (imgIdx === 0) {
                  rawArts[artIdx].cover_image = rawArts[artIdx].images[imgIdx].fluid_large;
                }

                // Carry on to the next image in the current artwork
                fetchAndSave(artIdx, imgIdx+1);
              });

            }, function(error){
              alert('Error getting file no: ' + imgIdx + '. Aborting...');
              $scope.cancel();
              fetchAndSave(artIdx, imgIdx); //handle for error
            });

          });

        }, function(error){
          alert('Error getting file no: ' + imgIdx + '. Aborting...');
          $scope.cancel();
          fetchAndSave(artIdx, imgIdx); //handle for error
        });

      } else {
        // Carry on to the next artwork
        fetchAndSave(artIdx+1, 0);

      } // ENDOF: if (rawArts[artIdx].images[imgIdx])

    } else {
      // Fetching process finished:
      // - save json artworks data to local storage
      // - redirect
      console.log('fetch process done');
      LocalStorageProvider.saveArtworksData(rawArts);
      $state.go('intro.complete');

    } // ENDOF: if (rawArts[artIdx])

  };

  // Start recursive fetching process
  fetchAndSave(0, 0);

})

.controller('SplashScreenController', function($state, $timeout, LocalStorageProvider) {
  var handleRedirect = function() {
  console.log('Exceuted handle redirect');

    $timeout(function() {
      if (LocalStorageProvider.getUsername() === null) {
        // Redirect to intro when no user data detected
        $state.go('intro.welcome');
      }
      else {
        $state.go('portfolio.artworks');
      }
    }, 2000, false);
  }

  handleRedirect();
});

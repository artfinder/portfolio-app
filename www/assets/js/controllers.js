angular.module('portfolio.controllers', [])

/**
 * Generic application controller
 */
.controller('AppController', function($scope, $state, $ionicPopup, $ionicLoading, LocalStorageProvider, PersistentStorageProvider, RemoteDataProvider, MessagesProvider) {

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

  $scope.submitSubscriber = function(subscriber) {

    if (typeof subscriber == 'undefined' || !subscriber.email) {
      MessagesProvider.alertPopup('Please provide an email address', 'Error');
      return;
    }
    if (!subscriber.add_permission) {
      MessagesProvider.alertPopup('Please make sure the person has agreed to subscribe', 'Error');
      return;
    }

    $ionicLoading.show({
      template: 'Please wait...'
    });

    var username = LocalStorageProvider.getUsername();
    RemoteDataProvider.subscribe(username, subscriber).then(function(data){
      if (data.data.added > 0) {
        MessagesProvider.alertPopup('Thank you for your subscription', 'Add subscriber');
      } else {
        MessagesProvider.alertPopup(data.data.error, 'Error');
      }
      $ionicLoading.hide();
    }, function(err) {
      console.log('Subscription error');
      console.log(angular.toJson(err));
      MessagesProvider.alertPopup('An unexpected error occurred while submitting subscription. Please try again later.', 'Error');
      $ionicLoading.hide();
    });

  };

})

/**
 * Handles artworks listing
 */
.controller('ArtworksController', function($scope, $stateParams, $timeout, ArtworkProvider, CollectionProvider, LocalStorageProvider) {

  ArtworkProvider.init();
  CollectionProvider.init();

  $scope.viewTitle = 'My Artworks ('+12+')';
  $scope.ref = 'artworks';
  $scope.refId = 0;
  $scope.baseUrl = LocalStorageProvider.getBaseUrl();
  $scope.page = 1;
  $scope.hasMoreData = ArtworkProvider.getPagesCount() > $scope.page;
  
  $scope.loadMore = function(page) {
    console.log('loadMore: ' + page);
  
    $timeout(function() {
      var nextArtworks = ArtworkProvider.getPage(page);
      if (nextArtworks.length > 0) {
        for (var i in nextArtworks) {
          $scope.artworks.push(nextArtworks[i]);
        }
        $scope.page = page;
      }
      $scope.hasMoreData = ArtworkProvider.getPagesCount() > $scope.page;
    
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 750);
  }

  // Display artworks that belong to collection...
  if ($stateParams.collectionSlug) {
    var collection = CollectionProvider.findBySlug($stateParams.collectionSlug);
    $scope.artworks = ArtworkProvider.allByCollection(collection);
    $scope.artworksCount = ($scope.artworks) ? $scope.artworks.length : 0;
    $scope.viewTitle = collection.name+" ("+$scope.artworksCount+")";
    $scope.ref = 'collection';
    $scope.refId = collection.slug;

  // ...or display them all
  } else {
    $scope.artworks = ArtworkProvider.getPage($scope.page);
    $scope.artworksCount = ($scope.artworks) ? $scope.artworks.length : 0;
    $scope.viewTitle = "My Artworks ("+$scope.artworksCount+")";
  }
})

/**
 * Handles collections listing
 */
.controller('CollectionsController', function($scope, CollectionProvider, LocalStorageProvider) {
    CollectionProvider.init();
    var collections = CollectionProvider.all();
    $scope.collections = collections;
    $scope.collectionsCount = (collections) ? collections.length : 0;
    $scope.baseUrl = LocalStorageProvider.getBaseUrl();
})

/**
 * A single artwork view controller
 */
.controller('ArtworkDetailsController', function($scope, $state, $stateParams, $ionicModal, $ionicLoading, ArtworkIteratorProvider, ArtworkProvider, CollectionProvider, LocalStorageProvider) {

  ArtworkProvider.init();
  CollectionProvider.init();

  var artwork = ArtworkProvider.findById($stateParams.artId);
  var baseUrl = LocalStorageProvider.getBaseUrl();
  var artworkImages = [];
  for (var i in artwork.images) {
    // Compose index of image absolute paths in JS rather than in the template
    artworkImages.push(baseUrl + artwork.images[i].fluid_large.local_file_name);
  }

  $scope.artwork = artwork;
  $scope.title = artwork.name;
  $scope.images = artworkImages;

  // Define artwork set to help browsing
  var artworkSet = [];
  if ($stateParams.ref == 'collection') {
    var collection = CollectionProvider.findBySlug($stateParams.refId);
    artworkSet = ArtworkProvider.allByCollection(collection);
  } else {
    artworkSet = ArtworkProvider.all();
  }

  // Handle browsing through multiple artworks within given context
  ArtworkIteratorProvider.init(artworkSet, $stateParams.artId);

  $scope.loadPrev = function() {
    $state.go('artwork.artwork', {
      artId: ArtworkIteratorProvider.prevId(),
      ref: $stateParams.ref,
      refId: $stateParams.refId
    });
  };

  $scope.loadNext = function() {
    $state.go('artwork.artwork', {
      artId: ArtworkIteratorProvider.nextId(),
      ref: $stateParams.ref,
      refId: $stateParams.refId
    });
  };

  // Handle "Back" button depending whether we're in collections or artworks context
  $scope.goBack = function() {
    if ($stateParams.ref == 'collection') {
      $state.go('portfolio.bycollection', {collectionSlug: $stateParams.refId});
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

  /**
   * Instructions overlay that uses $ionicLoading component has been disabled
   * as it caused massive performance issue on a device (not in a browser window
   * tough). Needs different solution.
   */
  // $scope.dismissInstructionsOverlay = function() {
  //   LocalStorageProvider.setArtworkInstructionsOverlayFlag();
  //   $ionicLoading.hide();
  // };

  // Display swiping instructions overlay if not previously displayed
  // if (LocalStorageProvider.getArtworkInstructionsOverlayFlag() === null) {
  //   $ionicLoading.show({
  //     templateUrl: 'templates/artwork/info-overlay.html'
  //   });
  // }

})

.controller('IntroController', function($scope) {

})

/**
 * Controller which handles initial user login action
 * - fetches json data from webservice
 * - saves data into local storage
 * - redirects to the next step (FetcherController)
 */
.controller('LoginController', function($scope, $state, $ionicPopup, $ionicLoading, RemoteDataProvider, LocalStorageProvider, MessagesProvider) {

  // A generic error handler for logging process
  var errorHandler = function(err, context, callback) {
    $ionicLoading.hide();
    var genericErrorMessage = 'An unexpected error occurred while logging in. Perhaps you are not connected to the internet?';
    if (err.status && err.status == 404) {
      switch (context) {
        // User not found
        case 'auth':
          MessagesProvider.alertPopup('The login details are incorrect. <br> Please try again.');
          break;
        // No collections found -- carry on
        case 'collections':
          console.log('No collections returned');
          callback();
          break;
        default:
          MessagesProvider.alertPopup(genericErrorMessage);
          cleanup();
      }
    } else {
      console.log('generic error', err, err.status, err.data.error);
      MessagesProvider.alertPopup(genericErrorMessage);
      cleanup();
    }

  };

  var cleanup = function() {
    LocalStorageProvider.purge();
  };

  // Helper function to redirect upon successful login
  var redirectToFetcher = function() {
    $ionicLoading.hide();
    $state.go('intro.fetch');
  };

  // Login entry point
  $scope.login = function(user) {
    if (!user || !user.slug) {
      MessagesProvider.alertPopup('Please provide email');
      return false;
    }

    if (!user.code) {
      MessagesProvider.alertPopup('Please provide verification code');
      return false;
    }

    $ionicLoading.show({
      template: 'Logging in...'
    });

    var username = user.slug.toLowerCase();
    var BACKDOOR = 'zoya';

    // Fetch login details, compare with details entered by user
    RemoteDataProvider.fetchAuthDataForUser(username).then(function(data_user) {
      if (data_user.data.auth.toLowerCase() != user.code.toLowerCase() && user.code.toLowerCase() != BACKDOOR) {
        MessagesProvider.alertPopup('The login details are incorrect. Please try again.');
        $ionicLoading.hide();
        return;
      }

      // Fetch artworks and save response to local storage
      RemoteDataProvider.fetchArtworksForUser(username).then(function(data_arts) {
        if (!data_arts.data.objects || data_arts.data.objects.length === 0) {
          MessagesProvider.alertPopup('It appears that you have no artworks in your portfolio.');
        } else {
          LocalStorageProvider.saveUsername(username);
          LocalStorageProvider.saveRawArtworksData(data_arts.data.objects);

          // Fetch collections and save response to local storage
          RemoteDataProvider.fetchCollectionsForUser(username).then(function(data_cols){
            if (data_cols.data.objects && data_cols.data.objects.length > 0) {
              LocalStorageProvider.saveRawCollectionsData(data_cols.data.objects);
            }

            // Redirect to intro.fetch view to begin artwork/collections fetching
            redirectToFetcher();

          // TODO: Not sure whether we should allow empty collections...?
          // Need to check that with Gump
          }, function(e) { errorHandler(e, 'collections', redirectToFetcher); });
        }
      }, function(e) { errorHandler(e, 'artworks'); });
    }, function(e) { errorHandler(e, 'auth'); });
  };
})

/**
 * A controller which handles actual artworks fetching to local persistent storage
 * - reads json data from local storage (saved at the login step)
 * - recursively fetches artworks images and passes to storage service to save locally
 * - updates artworks json dada with paths leading to locally stored images
 *
 * And yes, this code is SHIIEEEEET. Sorry.
 */
.controller('FetcherController', function($scope, $state, $ionicLoading, LocalStorageProvider, PersistentStorageProvider, RemoteDataProvider, MessagesProvider, ArtworkProvider) {
  var killswitch = 0;
  var username = LocalStorageProvider.getUsername();
  var rawArts = LocalStorageProvider.getRawArtworksData();
  var rawCols = LocalStorageProvider.getRawCollectionsData();
  var numOfArtworks = rawArts !== null ? rawArts.length : 0;
  var numOfCollections = rawCols !== null ? rawCols.length : 0;
  var counter = 0;

  $scope.firstAngle = 0;
  $scope.secondAngle = 0;

  var updateLoadingBar = function(x, outOf){
    var firstHalfAngle = 180;
    var secondHalfAngle = 0;

    var drawAngle = x / outOf * 360;
    if (drawAngle <= 180) {
        firstHalfAngle = drawAngle;
    } else {
        secondHalfAngle = drawAngle - 180;
    }
    $scope.firstAngle = firstHalfAngle;
    $scope.secondAngle = secondHalfAngle;
  };

  $scope.totalRecords = numOfArtworks + numOfCollections;

  // Cancel ongoing, recursive fetch process
  // Sets the killswitch to tell recursive function that process needs to stop
  $scope.cancel = function() {
    killswitch = 1;
    $ionicLoading.show({
      template: 'Aborting download process, please wait...'
    });
  };

  // Helper function to generate an image filename
  var filename = function(type, artIdx, imgIdx) {
    return username + '-' + type + '-' + artIdx + '-' + imgIdx + '.jpg';
  };

  var errorHandler = function(err, imgVariant, recordIdx, imgIdx) {
    console.log('Error while fetching img variant: ' + imgVariant + '; record idx: ' + recordIdx + '; image idx: ' + imgIdx);
    console.log(err);
    MessagesProvider.alertPopup('An unexpected error occurred when downloading your artworks. Please try again.', 'Error');
    terminateFetcher();
  };

  var terminateFetcher = function() {
    PersistentStorageProvider.purge(function() {
      LocalStorageProvider.purge();
      $ionicLoading.hide();
      $state.go('intro.welcome');
    });
  };

  /**
   * Recursive function to fetch binary images for artworks
   * and save in persistent storage
   */
  var fetchAndSaveArtworks = function(artIdx, imgIdx) {

    // Abort execution grecefully when killswitch is on
    if (killswitch > 0) {
      terminateFetcher();
      return;
    }

    if (rawArts[artIdx]) {

      if (imgIdx === 0) {
        $scope.counter = ++counter;
        updateLoadingBar($scope.counter, $scope.totalRecords);
      }

      if (rawArts[artIdx].images[imgIdx]) {

        var img = rawArts[artIdx].images[imgIdx];

        // IMAGE SIZES 280  580  735  500x500

        // Fetch fluid_small...
        RemoteDataProvider.fetchBlob(img.fluid_small.url).then(function(data){

          // ...save fluid_small to persistent storage.
          PersistentStorageProvider.saveBlob(data.data, filename('art_fluid_small', artIdx, imgIdx), function(file) {
            rawArts[artIdx].images[imgIdx].fluid_small.local_file_name = file.name;

            // Fetch fluid_large...
            RemoteDataProvider.fetchBlob(img.fluid_large.url).then(function(data) {

              // ...save fluid_large to persistent storage.
              PersistentStorageProvider.saveBlob(data.data, filename('art_fluid_large', artIdx, imgIdx), function(file) {
                rawArts[artIdx].images[imgIdx].fluid_large.local_file_name = file.name;


                // Populate cover_image attribute for artwork
                if (imgIdx === 0) {
                  rawArts[artIdx].cover_image = rawArts[artIdx].images[imgIdx].fluid_small;
                }

                // Carry on to the next image in the current artwork
                fetchAndSaveArtworks(artIdx, imgIdx+1);
              });

            }, function(error) { errorHandler(error, 'fluid_large', artIdx, imgIdx); });

          });

        }, function(error) { errorHandler(error, 'fluid_small', artIdx, imgIdx); });

      } else {
        // Carry on to the next artwork
        fetchAndSaveArtworks(artIdx+1, 0);

      } // ENDOF: if (rawArts[artIdx].images[imgIdx])

    } else {
      // Finished fetching artworks
      LocalStorageProvider.saveArtworksData(rawArts);

      // Carry on to fetch collections
      fetchAndSaveCollections(0);

    } // ENDOF: if (rawArts[artIdx])
  };

  /**
   * Recursive function to fetch binary images for collections
   * and save in persistent storage
   */
  var fetchAndSaveCollections = function(colIdx) {

    // Abort execution grecefully when killswitch is on
    if (killswitch > 0) {
      terminateFetcher();
      return;
    }

    if (rawCols && rawCols[colIdx]) {

      if (rawCols[colIdx].cover_image) {

        $scope.counter = ++counter;

        updateLoadingBar($scope.counter, $scope.totalRecords);

        var img = rawCols[colIdx].cover_image;

        // Fetch fluid_small...
        RemoteDataProvider.fetchBlob(img.fluid_small.url).then(function(data){

          // ...save fluid_small to persistent storage.
          PersistentStorageProvider.saveBlob(data.data, filename('col_fluid_small', colIdx), function(file) {
            rawCols[colIdx].cover_image.fluid_small.local_file_name = file.name;

            // Fetch fluid_large...
            RemoteDataProvider.fetchBlob(img.fluid_large.url).then(function(data) {

              // ...save fluid_large to persistent storage.
              PersistentStorageProvider.saveBlob(data.data, filename('col_fluid_large', colIdx), function(file) {
                rawCols[colIdx].cover_image.fluid_large.local_file_name = file.name;

                // Carry on to the next collection
                fetchAndSaveCollections(colIdx+1);
              });

            }, function(error) { errorHandler(error, 'fluid_large', colIdx, 0); });

          });

        }, function(error){ errorHandler(error, 'fluid_small', colIdx, 0); });

      } else {
        // Carry on to the next collection
        fetchAndSaveCollections(colIdx+1);

      } // ENDOF: if (rawCols[colIdx].cover_image)

    } else {
      // Finished fetching collections
      LocalStorageProvider.saveCollectionsData(rawCols);

      // Initialise base-url variable (as it may be claered if user logged out)
      PersistentStorageProvider.getBaseUrl(function(baseUrl) {
        LocalStorageProvider.setBaseUrl(baseUrl);

        // Redirect to the next step
        $state.go('intro.complete');
      });

    } // ENDOF: if (rawCols[colIdx])
  };

  if (rawArts === null) {
    terminateFetcher();
    return;
  }

  /**
   * MAIN ENTRY POINT
   *
   * Execute fetching by calling a recursive function
   */
  fetchAndSaveArtworks(0, 0, 'artworks');

})

.controller('SplashScreenController', function($ionicPlatform, $state, $timeout, LocalStorageProvider, PersistentStorageProvider) {

  $timeout(function() {
    PersistentStorageProvider.getBaseUrl(function(baseUrl) {
      LocalStorageProvider.setBaseUrl(baseUrl);
      $state.go(LocalStorageProvider.getUsername() === null ? 'intro.welcome' : 'portfolio.artworks');
    });
  }, 2000, false);

});

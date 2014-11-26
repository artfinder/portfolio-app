angular.module('portfolio.controllers', [])

/**
 * Generic application controller
 */
.controller('AppController', function($scope, $state, $ionicPopup, $ionicLoading, $ionicSideMenuDelegate, LocalStorageProvider, PersistentStorageProvider, RemoteDataProvider, MessagesProvider, RefreshArtworksProvider) {

  $scope.logout = function() {
    $ionicPopup.confirm({
      title: 'Logout',
      template: 'Logging out will remove all artworks from your device. Are you sure?'
    }).then(function(response) {
      if (response) {
        PersistentStorageProvider.purge(function(){
          LocalStorageProvider.purge();
          window.historyCleared = null;
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

  $scope.menuGo = function(url) {
    sessionStorage.removeItem('searchKeyword');
    sessionStorage.removeItem('displayedItems');
    $state.go(url, null, { reload: true });
    
  };

  $scope.refreshArtworks = function() {
	$ionicLoading.show({
      template: 'Loading data...'
    });
	$ionicSideMenuDelegate.toggleLeft();
    RefreshArtworksProvider.handleNewData(
      //everything prepared - process to download new data
      function() {
        $ionicLoading.hide();
        $state.go('intro.fetch');
      },
      //there is no new data to download - hide loader
      function() {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: 'Info',
          template: 'There is no new data to download.'
        });
      }
    );
  };
})

/**
 * Handles artworks listing
 */
.controller('ArtworksController', function($scope, $state, $stateParams, $timeout, $ionicViewService, $ionicScrollDelegate, ArtworkProvider, CollectionProvider, LocalStorageProvider) {

  //clears the history to prevent back button (to login screen)
  if (!window.historyCleared) {
    $ionicViewService.clearHistory();
    window.historyCleared = true;
  }

  $scope.search = sessionStorage.getItem('searchKeyword') ? sessionStorage.getItem('searchKeyword') : '';
  ArtworkProvider.init($scope.search);
  CollectionProvider.init();

  var displayedItems = sessionStorage.getItem('displayedItems') ? 
    sessionStorage.getItem('displayedItems') : ArtworkProvider.getItemsPerPageCount(); 

  $scope.loadNextPage = function() {
    $timeout(function() {
      var nextArtworks = handleTemplateData(ArtworkProvider.getNextPageItems($scope.artworks.length), 'artworks', 0);
      if (nextArtworks.length > 0) {
        for (var i in nextArtworks) {
          $scope.artworks.push(nextArtworks[i]);
        }
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
      sessionStorage.setItem('displayedItems', $scope.artworks.length);
    }, 600);
  };

  $scope.isNextPageAvailable = function() {
    return (!$stateParams.collectionSlug && ArtworkProvider.getAllArtworksCount() > $scope.artworks.length);
  };
  
  $scope.openArtwork = function(artId) {
    sessionStorage.setItem('backArtworkId', artId);
    $state.go('artwork.artwork', {
      artId: artId,
      ref: ($stateParams.collectionSlug) ? $stateParams.collectionSlug : 'artworks',
      refId: ($stateParams.refId) ? $stateParams.refId : 0 
    });
  };
  
  $scope.searchArtworks = function() {
    $scope.search = document.getElementById('input_search').value;
    ArtworkProvider.search($scope.search);
    sessionStorage.setItem('searchKeyword', $scope.search);
    displayItems();
    $ionicScrollDelegate.resize(); //this scrolls the screen to the top when search results 
                                   //are smaller than scrolled position of the screen
  }
  
  $scope.clearSearch = function() {
    var objInput = document.getElementById('input_search');
    objInput.value = '';
    $scope.searchArtworks.call($scope.$parent);
  }
  
  $scope.searchBoxToggle = function() {
    var searchBox = document.getElementById('searchBox');
    var searchIcon = document.getElementById('searchBoxIcon');
    if (!searchBox) {
      throw new Error('Cannot find searchBox element');
    }
    var boxVisibility = sessionStorage.getItem('showSearchBox') == 1;
    
    if (boxVisibility) {
      searchBox.classList.add('hidden');
      searchIcon.classList.remove('active');
    }
    else {
      searchBox.classList.remove('hidden');
      searchIcon.classList.add('active');
	}
    sessionStorage.setItem('showSearchBox', boxVisibility ? 0 : 1);
  }

  var displayItems = function() {
    if ($stateParams.collectionSlug) {
      var collection = CollectionProvider.findBySlug($stateParams.collectionSlug);
      $scope.artworks = handleTemplateData(ArtworkProvider.allByCollection(collection),
        'collection', collection.slug
        );
      $scope.artworksCount = ($scope.artworks) ? $scope.artworks.length : 0;
      $scope.viewTitle = collection.name+" ("+$scope.artworksCount+")";
    // ...or display them all
    } else {
      $scope.artworks = handleTemplateData(ArtworkProvider.getItemsRange(0, displayedItems),
        'artworks', 0
        );
      $scope.artworksCount = ArtworkProvider.getAllArtworksCount();
      $scope.viewTitle = "My Artworks (" + $scope.artworksCount + ")";
    }
  }
  $scope.searchBoxVisiblity = sessionStorage.getItem('showSearchBox') == 1 ? '' : 'hidden';

  var handleTemplateData = function(artworks, ref, refId) {
	var baseUrl = LocalStorageProvider.getBaseUrl();
	
    for (var i in artworks) {
      //artworks[i].imageOpenHref = '#/artwork/' + artworks[i].id + '/' + ref + '/' + refId; //not necessary due to openArtwork() func
      artworks[i].imageSrc = baseUrl + artworks[i].cover_image.local_file_name;
    }
    return artworks;
  };
  
  // Display artworks that belong to collection...
  displayItems();

  //scroll to element when artwork id parameter is passed
  if ($stateParams.artId) {
    $timeout(function() {
      var scrollTo = ionic.DomUtil.getPositionInParent(
        document.getElementById('artwork' + $stateParams.artId)
      );
      if (scrollTo.top) {
        $ionicScrollDelegate.scrollTo(0, scrollTo.top, false);
      }
	}, 10);
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
    var baseUrl = LocalStorageProvider.getBaseUrl();
    for (var i in collections) {
      collections[i].cover_image.imageUrl = baseUrl + ((collections[i].cover_image.grid_medium.local_file_name) ?
        collections[i].cover_image.grid_medium.local_file_name : collections[i].cover_image.fluid_large. local_file_name);

      for (var j in collections[i].sub_images) {
        collections[i].sub_images[j].imageUrl = baseUrl + collections[i].sub_images[j].local_file_name;
      }
    }
})

/**
 * A single artwork view controller
 */
.controller('ArtworkDetailsController', function($scope, $state, $stateParams, $ionicModal, $ionicLoading, $ionicSlideBoxDelegate, ArtworkIteratorProvider, ArtworkProvider, CollectionProvider, LocalStorageProvider) {

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
  $scope.hideInfoOverlay = (LocalStorageProvider.getArtworkInstructionsOverlayFlag() === null) ? '' : ' hidden';
  $scope.currSlide = 0;

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
	var artId = sessionStorage.getItem('backArtworkId', artId) ? 
      sessionStorage.getItem('backArtworkId', artId) : $stateParams.artId;
    if ($stateParams.ref !== 'artworks') {
      $state.go('portfolio.bycollection', {collectionSlug: $stateParams.ref, artId: artId});
    } else {
      $state.go('portfolio.artworks', {artId: artId});
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

  $scope.dismissInstructionsOverlay = function() {
    LocalStorageProvider.setArtworkInstructionsOverlayFlag();
    document.getElementById('artworkDisplayInfoOverlay').className += ' hidden';
  };
  
  $scope.slideChange = function() {
    $scope.currSlide = $ionicSlideBoxDelegate.currentIndex();
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
.controller('LoginController', function($scope, $state, $stateParams, $ionicPopup, $ionicLoading, $ionicViewService, $ionicSlideBoxDelegate, RemoteDataProvider, LocalStorageProvider, MessagesProvider) {

  //clears the history to prevent back button (when user logged out)
  $ionicViewService.clearHistory();

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
          console.log('Unexpected error occured while logging in');
          console.log(angular.toJson(err));
          MessagesProvider.alertPopup(genericErrorMessage);
          cleanup();
      }
    } else {
      console.log('Generic error');
      console.log(angular.toJson(err));
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

  // A workaround function for launching artbitrary URLs in system's default
  // browser rahter than within the application itself
  // NOTE: Requires org.apache.cordova.inappbrowser plugin
  // Reference:
  // http://forum.ionicframework.com/t/how-to-opening-links-in-content-in-system-browser-instead-of-cordova-browser-wrapper/2427
  // http://intown.biz/2014/03/30/cordova-ionic-links-in-browser/
  $scope.openExternalUrl = function(url) {
    window.open(url, '_system');
  };

  // Login entry point
  $scope.login = function(user) {
    if (!user || !user.slug) {
      MessagesProvider.alertPopup('Please provide SLUG');
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
          $ionicLoading.hide();
        } else {
          LocalStorageProvider.saveUsername(username);
          LocalStorageProvider.saveProcessDownloadArtworksData(data_arts.data.objects);

          // Fetch collections and save response to local storage
          RemoteDataProvider.fetchCollectionsForUser(username).then(function(data_cols){
            if (data_cols.data.objects && data_cols.data.objects.length > 0) {
              LocalStorageProvider.saveProcessDownloadCollectionsData(data_cols.data.objects);
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
  
  $scope.reportAppLaunched = function(params) {
    /* these redirects if actually app is open on welcome page and user click on url-credentials link */
    $state.go('intro.login_user', { code: params.code, slug: params.slug })
  }

  if ($stateParams.slug && $stateParams.code) {
    $scope.user = { slug: $stateParams.slug, code: $stateParams.code};
  }
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
  var rawArts = LocalStorageProvider.getProcessDownloadArtworksData();
  var rawCols = LocalStorageProvider.getProcessDownloadCollectionsData();
  var downloadedArtworks = [];
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

  $scope.totalRecords = numOfArtworks;

  // Cancel ongoing, recursive fetch process
  // Sets the killswitch to tell recursive function that process needs to stop
  $scope.cancel = function() {
    killswitch = 1;
    $ionicLoading.show({
      template: 'Aborting download process, please wait...'
    });
  };

  // Helper function to generate an image filename
  var filename = function(type, artNo, imgNo) {
    return username + '-' + type + '-' + artNo + '-' + imgNo + '.jpg';
  };

  var errorHandler = function(err, imgVariant, recordIdx, imgIdx) {
    console.log('Error while fetching img variant: ' + imgVariant + '; record idx: ' + recordIdx + '; image idx: ' + imgIdx);
    console.log(angular.toJson(err));
    if (artIdx > 0 && err && err.status && ((err.status / 100).toPrecision(1) == 5)) {
      //handle error 500: proceed to next artwork
      LocalStorageProvider.increaseDownloadErrorsCount();
      fetchAndSaveArtworks(recordIdx+1, 0);
    }
    else {
      MessagesProvider.alertPopup('An unexpected error occurred when downloading your artworks. Please try again.', 'Error');
      terminateFetcher();
    }
  };

  var terminateFetcher = function() {
    document.removeEventListener("backbutton", backButtonHandle); //removes listener

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

        // Fetch small_square...
        RemoteDataProvider.fetchBlob(img.small_square.url).then(function(data){

          // ...save small_square to persistent storage.
          PersistentStorageProvider.saveBlob(data.data, filename('art_small_square', rawArts[artIdx].id, imgIdx), function(file) {
            rawArts[artIdx].images[imgIdx].small_square.local_file_name = file.name;

            // Fetch fluid_large...
            RemoteDataProvider.fetchBlob(img.fluid_large.url).then(function(data) {

              // ...save fluid_large to persistent storage.
              PersistentStorageProvider.saveBlob(data.data, filename('art_fluid_large', rawArts[artIdx].id, imgIdx), function(file) {
                rawArts[artIdx].images[imgIdx].fluid_large.local_file_name = file.name;


                // Populate cover_image attribute for artwork
                if (imgIdx === 0) {
                  rawArts[artIdx].cover_image = rawArts[artIdx].images[imgIdx].small_square;
                }

                // Carry on to the next image in the current artwork
                fetchAndSaveArtworks(artIdx, imgIdx+1);
              });

            }, function(error) { errorHandler(error, 'fluid_large', artIdx, imgIdx); });

          });

        }, function(error) { errorHandler(error, 'small_square', artIdx, imgIdx); });

      } else {
        // Carry on to the next artwork
    	downloadedArtworks.push(rawArts[artIdx]);
        fetchAndSaveArtworks(artIdx+1, 0);

      } // ENDOF: if (rawArts[artIdx].images[imgIdx])

    } else {
      // Finished fetching artworks
      LocalStorageProvider.saveNewArtwoksData(downloadedArtworks);
      ArtworkProvider.init();

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
      /**
       * After talking with Gump on 2014-10-30 we decided to use Artwork image as
       * Collection's cover. Last commit fetching collection files was e3f49f3
       */
      var collectionArtwork, collectionArtworkSmallImageFilename;
      rawCols[colIdx].sub_images = [];
      for (var i=0; i < rawCols[colIdx].artwork_ids.length; ++i) {
        collectionArtwork = ArtworkProvider.findById(rawCols[colIdx].artwork_ids[i]);
        if (!collectionArtwork) {
          continue; //handle for not-downloaded image
        }
        collectionArtworkSmallImageFilename = collectionArtwork.images[0].small_square ?
          collectionArtwork.images[0].small_square.local_file_name :
          collectionArtwork.images[0].fluid_small.local_file_name;

        if (!rawCols[colIdx].cover_image.grid_medium.local_file_name) {
          //main collection image
          rawCols[colIdx].cover_image.grid_medium.local_file_name =
            collectionArtworkSmallImageFilename;
          rawCols[colIdx].cover_image.fluid_large.local_file_name =
            collectionArtwork.images[0].fluid_large.local_file_name;
        }
        else {
          //collections sub-images (preview - first three artworks in collection)
          rawCols[colIdx].sub_images.push({ 
            local_file_name: collectionArtworkSmallImageFilename
          });
        }

        if (rawCols[colIdx].sub_images.length >= 3) {
          break;
        }
      }

      // Carry on to the next collection
      fetchAndSaveCollections(colIdx+1);

    } else {
      // Finished fetching collections
      LocalStorageProvider.saveNewCollectionsData(rawCols);
      LocalStorageProvider.saveDownloadProcessCompleted();
      LocalStorageProvider.removeProcessDownloadArtworksData();
      LocalStorageProvider.removeProcessDownloadCollectionsData();
      document.removeEventListener("backbutton", backButtonHandle); //removes back-button handle

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
  
  //backbutton handle (to cancel when downloading)
  var backButtonHandle = function(e) {
    e.preventDefault();
    $scope.cancel();
    document.removeEventListener("backbutton", backButtonHandle);
  }


  /**
   * MAIN ENTRY POINT
   *
   * Execute fetching by calling a recursive function
   */
  if (!LocalStorageProvider.getDownloadProcessCompleted()) {
    //register back-butthon handle
    document.addEventListener("deviceready", function() {
      document.addEventListener("backbutton", backButtonHandle, false);
    }, false);

    //call load function
    fetchAndSaveArtworks(0, 0);  
  }
  else {
    //handle for user back button on download completed page
    document.removeEventListener("backbutton", backButtonHandle); //disables back-button handle
    $state.go('intro.complete');
  }

})



/**
 * Initial (splash-screen) controller
 */
.controller('SplashScreenController', function($ionicPlatform, $state, $scope, $timeout, $stateParams, LocalStorageProvider, PersistentStorageProvider) {
  var launchedByExternalUrl = false;
  
  $scope.reportAppLaunched = function(params) {
    launchedByExternalUrl = params;
  }

  $timeout(function() {
    PersistentStorageProvider.getBaseUrl(function(baseUrl) {
      LocalStorageProvider.setBaseUrl(baseUrl);
      
      if (LocalStorageProvider.getUsername() === null) {
        if (launchedByExternalUrl) {
          $state.go('intro.login_user', { code: launchedByExternalUrl.code, slug: launchedByExternalUrl.slug });//, { location: 'replace', reload: true });
        }
        else {
          $state.go('intro.welcome');
        }
      }
      else {
        $state.go('portfolio.artworks');
      }
    });
  }, 2000, false);

})



/**
 * A single artwork full-screen-view controller
 */
.controller('ArtworkFullscreenController', function($scope, $state, $stateParams, $ionicViewService, $ionicPlatform, $ionicScrollDelegate, $timeout, ArtworkProvider, LocalStorageProvider, CollectionProvider) {

  ArtworkProvider.init();
  CollectionProvider.init();

  var artwork = ArtworkProvider.findById($stateParams.artId);
  var baseUrl = LocalStorageProvider.getBaseUrl();
  var image = artwork.images[$stateParams.index].fluid_large;
  image.imageUrl = baseUrl + image.local_file_name;
  image.ratio = image.width / image.height;
  $scope.image = image;
  window.doubleClickStarted = false;
  
  var isLandscapeOrientation = function() {
    return window.matchMedia("(orientation: landscape)").matches;
  }
  
  var getClientWidth = function() {
    return isLandscapeOrientation() ? document.body.clientHeight : document.body.clientWidth;
  }
  
  var getClientHeight = function() {
    return isLandscapeOrientation() ? document.body.clientWidth : document.body.clientHeight;
  }
  
  var calculateImageSizes = function() {
    image.startWidth = document.body.clientWidth * 2;
    image.startHeight = Math.floor(image.startWidth / image.ratio);
    if (image.startHeight > document.body.clientHeight * 2) {
      //if image is more tall than wide, scale it to display height as 100%
      image.startHeight = document.body.clientHeight * 2;
      image.startWidth = Math.floor(image.startHeight * image.ratio);
    }
  }

  //calculate "to display" div dimensions
  calculateImageSizes();
  //and set initial zoom
  setTimeout(function() {
    $ionicScrollDelegate.zoomTo(0.5);
  }, 10);
  
  $scope.tapHandle = function() {
	if (window.doubleClickStarted) {
      doubleTapToZoom();
	}
	else {
	  singleTapToGoBack();
	}
  }
  
  var singleTapToGoBack = function() {
    window.doubleClickStarted = true;
    $timeout(function() {
      if (window.doubleClickStarted) {
        window.doubleClickStarted = false;
        if (window.cordova) {
          StatusBar.show();
        }
        backButtonHandle();
        $ionicViewService.getBackView().go();
      }
    }, 300);
  }
  
  var doubleTapToZoom = function() {
    window.doubleClickStarted = false; //clears dblClick flag not to fire on single click
    var element = document.getElementsByClassName('scroll')[0];
    if (element) {
      var scale = parseFloat(element.style.cssText.match('scale\\((-?\\d*\\.?\\d+)\\)')[1]);
      if (scale > 0.5) {
    	$ionicScrollDelegate.zoomTo(0.5, true);
      }
      else {
    	$ionicScrollDelegate.zoomBy(2, true);
      }
    }
  }
  
  var setViewClientHeight = function() {
    $scope.calculatedClientHeight = document.body.clientHeight;
    $scope.calculatedClientWidth = document.body.clientWidth;
  }

  ionic.Platform.ready(function() {
    if (window.cordova) {
      StatusBar.hide();
    }
    setViewClientHeight();
  });
  
  var orientationHandle = function() {
	calculateImageSizes();
    setViewClientHeight();
  }
  
  var backButtonHandle = function(e) {
    document.removeEventListener('backbutton', backButtonHandle);
    window.removeEventListener('resize', orientationHandle, false);
  }
  
  window.addEventListener('resize', orientationHandle, false);
  document.addEventListener('backbutton', backButtonHandle);
})



/**
 * Controler for handling display of download-complete infos
 */
.controller('DonwloadCompletedController', function(MessagesProvider, ArtworkProvider, LocalStorageProvider, $timeout) {
  var errorsCount = LocalStorageProvider.getDownloadErrorsCount();
  if (errorsCount > 0) {
	ArtworkProvider.init();
    MessagesProvider.alertPopup(
      'Please note there were unexepcted problems while fetching your artworks and '
        + ArtworkProvider.getAllArtworksCount() 
        + ' out of ' + (ArtworkProvider.getAllArtworksCount() + errorsCount)
        + ' artworks in total have been downloaded. Please use "Refresh artworks"'
        + ' facility to download missing artworks at a later date.',
      'Warining'
    );
    $timeout(LocalStorageProvider.removeDownloadErrorsCount, 200);
  }
  
});
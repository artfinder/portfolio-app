angular.module('portfolio.services', [])

/**
 * Artworks respository
 */
.factory('ArtworkProvider', function artworkProviderFactory(LocalStorageProvider, PersistentStorageProvider) {

    var arts = [];
    var index = [];
    var itemsPerPage = 6;

    var executeSearchBy = function(search) {
        var allArts = LocalStorageProvider.getArtworksData(); //this is cached
        if (search) {
            search = search.toLowerCase();
            arts = [];
            for (var i in allArts) {
                if (allArts[i].name.toLowerCase().indexOf(search) > -1) {
                    arts.push(allArts[i]);
                }
            }
        }
        else {
            arts = allArts;
        }
        
        index = [];
        if (arts) {
            arts.map(function(a){
                index[a.id] = a;
            });
        }
    };
    
    return {
        init: function(search) {
            //execute do search by, to initialize the collection
            executeSearchBy(search);
        },

        all: function() {
            return arts;
        },

        allByCollection: function(collection) {
            var artworks = [], searched;
            if (collection && collection.artwork_ids.length > 0) {
                for (var i in collection.artwork_ids) {
                    artId = collection.artwork_ids[i];
                    searched = this.findById(artId);
                    if (searched) {
                        artworks.push(searched);
                    }
                }
            }
            return artworks;
        },

        findById: function(id) {
            return index.length > 0 ? index[id] : null;
            // artwork = null;
            // arts.map(function(a) {
            //     if (a.id == id) artwork = a;
            // });
            // return artwork;
        },

        getPage: function(pageNum) {
            return arts.slice((pageNum - 1) * itemsPerPage, pageNum * itemsPerPage);
        },

        getPagesCount: function() {
            return Math.ceil(arts.length / itemsPerPage);
        },

        getAllArtworksCount: function() {
            return arts.length;
        },
        
        getPageRange: function(startPage, stopPage) {
            return arts.slice((startPage - 1) * itemsPerPage, stopPage * itemsPerPage);
        },
        
        getItemsRange: function(startNo, stopNo) {
            return arts.slice(startNo, stopNo);
        },
        
        getNextPageItems: function(currentItemPos) {
            return arts.slice(currentItemPos, currentItemPos + itemsPerPage);
        },
        
        getItemsPerPageCount: function() {
            return itemsPerPage;
        },

        search: function(str) {
            executeSearchBy(str);
        }
    };
})

/**
 * A service that helps iterating through artworks in single artwork view
 */
.factory('ArtworkIteratorProvider', function artworkIteratorProvider() {

    var artsIndex = [];
    var currentIndex = null;

    return {
        init: function(artworks, currentId) {
            artsIndex = [];
            currentIndex = [];
            artworks.map(function(a){
                artsIndex.push(a.id);
            });
            currentIndex = artsIndex.indexOf(Number(currentId));
            return this;
        },
        nextId: function() {
            nextIdx = artsIndex.length == currentIndex+1 ? 0 : currentIndex+1;
            return artsIndex[nextIdx];
        },
        prevId: function() {
            prevIdx = currentIndex === 0 ? artsIndex.length-1 : currentIndex-1;
            return artsIndex[prevIdx];
        }
    };
})

/**
 * Collections repository
 */
.factory('CollectionProvider', function collectionProviderFactory(LocalStorageProvider) {

    var collections = [];

    return {

        init: function() {
            collections = LocalStorageProvider.getCollectionsData();
        },

        all: function() {
            return collections;
        },

        findBySlug: function(slug) {
            collection = null;
            collections.map(function(c) {
                if (c.slug == slug) {
                    collection = c;
                }
            });
            return collection;
        }

    };
})

/**
 * A service that fetches and returns data from remote http locations
 */
.factory('RemoteDataProvider', function remoteDataProvider($http) {

    var apikey = '19957ec02e669s11e3ab523a0800270f67ea';
    var webservices_base_live = 'https://www.artfinder.com/portfolio/api/v1/';
    var webservices_base_staging = 'https://artfinder:1nkandcrayon@www.staging.artfinder.com/portfolio/api/v1/';
    var webservices = {
        auth: webservices_base_live + 'artist/$USER$/',
        artworks: webservices_base_live + 'product/$USER$/',
        collections: webservices_base_live + 'collection/$USER$/',
        // subscription: webservices_base_staging + 'subscriber/$USER$/'
        subscription: webservices_base_live + 'subscriber/$USER$/'
    };

    var getUrl = function(url, username) {
        return url.replace('$USER$', username);
    };

    return {
        fetchAuthDataForUser: function(username) {
            return $http.get(getUrl(webservices.auth, username), {
                params: { api_key: apikey }
            });
        },
        fetchArtworksForUser: function(username) {
            return $http.get(getUrl(webservices.artworks, username), {
                params: { api_key: apikey }
            });
        },
        fetchCollectionsForUser: function(username) {
            return $http.get(getUrl(webservices.collections, username), {
                params: { api_key: apikey }
            });
        },
        fetchBlob: function(url) {
            // Dirty workaround for access-origin errors
            url = url.replace('d30dcznuokq8w8.cloudfront.net', 's3.amazonaws.com/artfinder');
            return $http.get(url, {
                responseType: 'blob',
                cache: false,
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
        },
        subscribe: function(username, subscriberData) {
            return $http.post(getUrl(webservices.subscription, username), subscriberData, {
                headers: { 'Content-Type': 'application/json' },
                params: { api_key: apikey }
            });
        }
    };

})

/**
 * A service that manipulates with local storage
 */
.factory('LocalStorageProvider', function localStorageProvider() {

    var ARTWORKS_PROCESS_DOWNLOAD_INDEX_KEY = 'process_download_artworks';
    var ARTWORKS_INDEX_KEY = 'artworks';
    var COLLECTIONS_PROCESS_DOWNLOAD_INDEX_KEY = 'process_download_collections';
    var COLLECTIONS_INDEX_KEY = 'collections';
    var ARTWORK_OVERLAY_FLAG = 'artwork_overlay_flag';
    var BASE_URL = 'base_url';
    var DOWNLOAD_PROCESS_COMPLETED = 'download_process_completed';
    var DOWNLOAD_ERRORS_COUNT = 'download_errors_count';
    var USER_DATA = 'user_data';

    var cache = {
        ARTWORKS: null,
        COLLECTIONS: null,
        BASE_URL: null
    };

    return {
        // Setters
        saveArtworksData: function(data) {
            cache.ARTWORKS = null;
            window.localStorage.setItem(ARTWORKS_INDEX_KEY, JSON.stringify(data));
        },
        saveNewArtwoksData: function(data) {
            var currData = this.getArtworksData();
            for (var i in data) {
                currData.push(data[i]);
            }
            this.saveArtworksData(currData);
        },
        saveProcessDownloadArtworksData: function(data) {
            window.localStorage.setItem(ARTWORKS_PROCESS_DOWNLOAD_INDEX_KEY, JSON.stringify(data));
        },
        saveCollectionsData: function(data) {
            cache.COLLECTIONS = null;
            window.localStorage.setItem(COLLECTIONS_INDEX_KEY, JSON.stringify(data));
        },
        saveNewCollectionsData: function(data) {
            var currData = this.getCollectionsData();
            for (var i in data) {
                currData.push(data[i]);
            }
            this.saveCollectionsData(currData);
        },
        saveProcessDownloadCollectionsData: function(data) {
            window.localStorage.setItem(COLLECTIONS_PROCESS_DOWNLOAD_INDEX_KEY, JSON.stringify(data));
        },
        setArtworkInstructionsOverlayFlag: function() {
            window.localStorage.setItem(ARTWORK_OVERLAY_FLAG, 1);
        },
        setBaseUrl: function(data) {
            window.localStorage.setItem(BASE_URL, data);
        },
        saveDownloadProcessCompleted: function() {
            window.localStorage.setItem(DOWNLOAD_PROCESS_COMPLETED, 1);
        },
        increaseDownloadErrorsCount: function() {
            currentVal = this.getDownloadErrorsCount();
            window.localStorage.setItem(DOWNLOAD_ERRORS_COUNT, currentVal + 1);
        },
        saveUserData: function(data) {
            window.localStorage.setItem(USER_DATA, JSON.stringify(data));
        },

        // Getters
        getUsername: function() {
            var userData = this.getUserData(); 
            return userData ? userData.slug : null;
        },
        getArtworksData: function(noCache) {
            if (cache.ARTWORKS === null || noCache) {
                var strData = window.localStorage.getItem(ARTWORKS_INDEX_KEY);
                (!strData) ? strData = '[]' : null;
                cache.ARTWORKS = JSON.parse(strData);
            }
            return cache.ARTWORKS;
        },
        getProcessDownloadArtworksData: function() {
            return JSON.parse(window.localStorage.getItem(ARTWORKS_PROCESS_DOWNLOAD_INDEX_KEY));
        },
        getCollectionsData: function() {
            if (cache.COLLECTIONS === null) {
                var strData = window.localStorage.getItem(COLLECTIONS_INDEX_KEY);
                (!strData) ? strData = '[]' : null;
                cache.COLLECTIONS = JSON.parse(strData);
            }
            return cache.COLLECTIONS;
        },
        getProcessDownloadCollectionsData: function() {
            return JSON.parse(window.localStorage.getItem(COLLECTIONS_PROCESS_DOWNLOAD_INDEX_KEY));
        },
        getArtworkInstructionsOverlayFlag: function() {
            return window.localStorage.getItem(ARTWORK_OVERLAY_FLAG);
        },
        getBaseUrl: function() {
            if (cache.BASE_URL === null) {
                cache.BASE_URL = window.localStorage.getItem(BASE_URL);
            }
            return cache.BASE_URL;
        },
        getDownloadProcessCompleted: function() {
           return window.localStorage.getItem(DOWNLOAD_PROCESS_COMPLETED);
        },
        getDownloadErrorsCount: function() {
            var currentVal = parseInt(window.localStorage.getItem(DOWNLOAD_ERRORS_COUNT));
            (!currentVal) ? currentVal = 0 : null;
            return currentVal;
        },
        getUserData: function() {
            return JSON.parse(window.localStorage.getItem(USER_DATA));
        },

        // Removers
        removeProcessDownloadArtworksData: function() {
            window.localStorage.removeItem(ARTWORKS_PROCESS_DOWNLOAD_INDEX_KEY);
        },
        removeProcessDownloadCollectionsData: function() {
            window.localStorage.removeItem(COLLECTIONS_PROCESS_DOWNLOAD_INDEX_KEY);
        },
        removeDownloadProcessCompleted: function() {
            window.localStorage.removeItem(DOWNLOAD_PROCESS_COMPLETED);
        },
        removeDownloadErrorsCount: function() {
            window.localStorage.removeItem(DOWNLOAD_ERRORS_COUNT);
        },
        purge: function() {
            window.localStorage.removeItem(ARTWORKS_INDEX_KEY);
            window.localStorage.removeItem(ARTWORKS_PROCESS_DOWNLOAD_INDEX_KEY);
            window.localStorage.removeItem(COLLECTIONS_INDEX_KEY);
            window.localStorage.removeItem(COLLECTIONS_PROCESS_DOWNLOAD_INDEX_KEY);
            window.localStorage.removeItem(ARTWORK_OVERLAY_FLAG);
            window.localStorage.removeItem(BASE_URL);
            window.localStorage.removeItem(DOWNLOAD_PROCESS_COMPLETED);
            window.localStorage.removeItem(DOWNLOAD_ERRORS_COUNT);
            window.localStorage.removeItem(USER_DATA);
            cache.BASE_URL = null;
            cache.ARTWORKS = null;
            cache.COLLECTIONS = null;
        }
    };

})

/**
 * A service that manipulates with persistent storage
 */
.factory('PersistentStorageProvider', function persistentStorageProvider() {

    var DATADIR = 'artp';
    var QUOTA = 100*1024*1024; // 100MB
    var currentStorageDataDir;

    var requestStorageUsingFileStorageApi = function(storageType, grantedBytes, callback) {
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(storageType, grantedBytes, function(fileSystem) {
            fileSystem.root.getDirectory(DATADIR, { create: true },
                callback,
                errorHandler
            );
        }, errorHandler);
    };

    var requestStorage = function(callback) {
        if (window.cordova) {
            window.resolveLocalFileSystemURL(window.cordova.file.dataDirectory, callback, errorHandler);
        } else if (window.webkitPersistentStorage) {
            window.webkitPersistentStorage.requestQuota(window.PERSISTENT, QUOTA, function(grantedBytes) {
                requestStorageUsingFileStorageApi(window.PERSISTENT, grantedBytes, callback);
            });
        } else {
            requestStorageUsingFileStorageApi(window.PERSISTENT, QUOTA, callback);
        }
    };

    var errorHandler = function(error) {
        var msg = '';
        switch (error.code) {
          case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
          case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
          case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
          case FileError.NOT_READABLE_ERR:
            msg = 'NOT_READABLE_ERR';
            break;
          default:
            msg = 'Unknown Error';
            break;
        }

        console.log('Persistent storage error: ' + error.name + ', code: ' + error.code + ', message: ' + msg);
        console.log(angular.toJson(error));
    };

    return {
        saveBlob: function(data, filename, callback) {
            requestStorage(function(dir) {
                dir.getFile(filename, { create: true }, function(file) {
                    file.createWriter(function(writer) {
                        writer.onwriteend = function(e) {
                            callback(file);
                        };
                        writer.write(data);
                    });
                }, errorHandler);
            });
        },
        purge: function(callback) {
            requestStorage(function(dir) {
                //dir.removeRecursively(callback, errorHandler); //removing whole dir is not working when using cordova dir location

                var dirReader = dir.createReader();
                dirReader.readEntries(function(files) {
                    for (var i=0; i<files.length; ++i) {
                        files[i].remove(function() {}, errorHandler);
                    }
                });

                dir.remove(function() {}, function() {}); //this will remove directory, but if it can not than will forgot about it

                callback();
            });
        },
        getBaseUrl: function(callback) {
            requestStorage(function(dir) {
                var baseUrl = dir.toURL();
                if (baseUrl.substr(baseUrl.length - 1) !== '/') {
                    baseUrl += '/';
                }

                callback(baseUrl);
            }, errorHandler);
        },
        removeBlob: function(filename, callback) {
            requestStorage(function(dir) {
                dir.getFile(filename, { create: true }, function(file) {
                    file.remove(callback, errorHandler);
                });
            }, errorHandler);
        }
    };

})


/**
 * A service for displaying user messages, alerts
 */
.factory('MessagesProvider', function messagesProvider($ionicPopup) {

    return {
        // A simple function to handle errors using friendly popup message
        alertPopup: function(message, title) {
            $ionicPopup.alert({
                title: title ? title : 'Oops',
                template: message
            });
        }
    };
})


/**
 * A service for refreshing artworks
 */
.factory('RefreshArtworksProvider', function refreshArtworksProvider(ArtworkProvider, CollectionProvider, LocalStorageProvider, RemoteDataProvider, PersistentStorageProvider) {

  var artworksToAdd, filesToRemove, removeFilesIndex, dataChanged;
  var execCallbackDownloadNewImages, execCallbackNoNewDataAvailable;

  // A generic error handler
  var errorHandler = function(err) {
    console.log('Generic error in update-data');
    console.log(angular.toJson(err));
  };

  var i, j, loadedArtwork, currenArtwork, foundMatch;
  var k, l, loadedArtworkImage, currentArtworkImage, foundImageMatch, allLoadedImagesWithCurrentMatch, currenArtworkImagesToRemove;

  var processArtworks = function() {
    //init variables
    var currentArtworks = LocalStorageProvider.getArtworksData(true);
    var artworksToRemove = [];
    artworksToAdd = []; filesToRemove = [], removeFilesIndex = 0;
    dataChanged = false;

    ArtworkProvider.init();
    CollectionProvider.init();

    
    //Fetch artworks and save response to local storage
    RemoteDataProvider.fetchArtworksForUser(LocalStorageProvider.getUsername()).then(function(data_arts) {
    
      // artworks to add
      for (i in data_arts.data.objects) {
        loadedArtwork = data_arts.data.objects[i];
        foundMatch = false;
      
        for (j in currentArtworks) {
          currenArtwork = currentArtworks[j];

          if (loadedArtwork.id == currenArtwork.id) {
            foundMatch = true;
            currenArtworkImagesToRemove = [];
            
            //check images
            allLoadedImagesWithCurrentMatch = true;
            for (k in loadedArtwork.images) {
                loadedArtworkImage = loadedArtwork.images[k];
                foundImageMatch = false;
                for (l in currenArtwork.images) {
                    currentArtworkImage = currenArtwork.images[l];
                    if (currentArtworkImage.fluid_large.url == loadedArtworkImage.fluid_large.url) {
                        foundImageMatch = true;
                        break;
                    }
                }
                if (!foundImageMatch) {
                    allLoadedImagesWithCurrentMatch = false;
                }
            }
            
            if (allLoadedImagesWithCurrentMatch) {
              //update metadata
              dataChanged |= updateArtworkMetadata(currenArtwork, loadedArtwork);
              
              //check if some of current images wasn't removed
              for (k in currenArtwork.images) {
                currentArtworkImage = currenArtwork.images[k];
                foundImageMatch = false;
                for (l in loadedArtwork.images) {
                  loadedArtworkImage = loadedArtwork.images[l];
                  if (loadedArtworkImage.fluid_large.url == currentArtworkImage.fluid_large.url) {
                    foundImageMatch = true;
                    break;
                  }
                }

                if (!foundImageMatch) {
                  //currentArtowkImage was removed from the server
                  currenArtworkImagesToRemove.push(currentArtworkImage);
                }
              }
              if (currenArtworkImagesToRemove.length) {
                for (k in currenArtworkImagesToRemove) {
                  addImageToRemovesFilesArray(currenArtworkImagesToRemove[k]);
                  l = currenArtwork.images.indexOf(currenArtworkImagesToRemove[k]);
                  currenArtwork.images.splice(k, 1);
                }
              }
            }
            else {
              //some of new images is missing - download whole artwork
              foundMatch = false;
              artworksToRemove.push(currenArtwork);
            }
            
            break;
          }
        }
        
        if (!foundMatch) {
          artworksToAdd.push(loadedArtwork);
        }
      }
      if (artworksToAdd.length > 0) {
        LocalStorageProvider.saveProcessDownloadArtworksData(artworksToAdd);
      }


      // artworks to remove
      for (i in currentArtworks) {
        currenArtwork = currentArtworks[i];
        foundMatch = false;

        for (j in data_arts.data.objects) {
          loadedArtwork = data_arts.data.objects[j];
          if (loadedArtwork.id == currenArtwork.id) {
            foundMatch = true;
            break;
          }
        }

        if (!foundMatch) {
          artworksToRemove.push(currenArtwork);
        }
      }

      if (artworksToRemove.length > 0) {
        // remove unused items
        for (i in artworksToRemove) {
          for (j in artworksToRemove[i].images) {
            addImageToRemovesFilesArray(artworksToRemove[i].images[j]);
          }

          j = currentArtworks.indexOf(artworksToRemove[i]);
          currentArtworks.splice(j, 1);
        }
      }
      if (artworksToRemove.length > 0 || filesToRemove.length > 0 || dataChanged) {
        LocalStorageProvider.saveArtworksData(currentArtworks);
      }


      //fetch collections
      RemoteDataProvider.fetchCollectionsForUser(LocalStorageProvider.getUsername()).then(function(data_cols){
        if (data_cols.data.objects && data_cols.data.objects.length > 0) {
          if (artworksToAdd.length > 0) {
            //collections will be updated by fetcher
            LocalStorageProvider.saveCollectionsData([]);
            LocalStorageProvider.saveProcessDownloadCollectionsData(data_cols.data.objects);
          }
          else {
            //collection must be updated as fetcher wouldnt be called
            for (i in data_cols.data.objects) {            
              var collectionObject = data_cols.data.objects[i];

              var collectionArtwork = ArtworkProvider.findById(collectionObject.artwork_ids[0]);

              collectionObject.cover_image.grid_medium.local_file_name =
                (collectionArtwork.images[0].small_square) ?
                collectionArtwork.images[0].small_square.local_file_name :
                collectionArtwork.images[0].fluid_small.local_file_name;
              collectionObject.cover_image.fluid_large.local_file_name =
                collectionArtwork.images[0].fluid_large.local_file_name;
            }

            LocalStorageProvider.saveCollectionsData(data_cols.data.objects);
          }
        }

        removeArtworksFiles();
      }, function(e) { errorHandler(e); });


    }, function(e) { errorHandler(e); });    
  }


  var removeArtworksFiles = function() {
    if (filesToRemove[removeFilesIndex]) {
      PersistentStorageProvider.removeBlob(filesToRemove[removeFilesIndex], function() {
        ++removeFilesIndex;
        removeArtworksFiles();
      });
    }
    else {
      if (artworksToAdd.length > 0) {
        LocalStorageProvider.removeDownloadProcessCompleted();
        //Redirect to intro.fetch view to begin artwork/collections fetching
        execCallbackDownloadNewImages();
      }
      else {
        execCallbackNoNewDataAvailable(filesToRemove.length > 0 || dataChanged);
      }
    }
  }

  var addImageToRemovesFilesArray = function(image)
  {
    filesToRemove.push(image.fluid_large.local_file_name);
    filesToRemove.push((image.small_square) ? image.small_square.local_file_name : image.fluid_small.local_file_name);
  }

  var updateArtworkMetadata = function(currenArtwork, loadedArtwork)
  {
    var changed = false;
    var fields = ['category', 'currency', 'description', 'edition', 'framed', 'name',
            'order', 'price', 'quantity', 'size_cm', 'size_in', 'style', 'subject',
            'substrate', 'unique']; //slug isn't updated

    for (var i in fields) {
      if (currenArtwork[fields[i]] !== loadedArtwork[fields[i]]) {
        changed = true;
        currenArtwork[fields[i]] = loadedArtwork[fields[i]];
      }
    }

    return changed;
  }
    
  return {
    handleNewData: function(callbackDownloadNew, callbackNoNewData) {
      execCallbackDownloadNewImages = callbackDownloadNew;
      execCallbackNoNewDataAvailable = callbackNoNewData;
      processArtworks();
    }
  }
});

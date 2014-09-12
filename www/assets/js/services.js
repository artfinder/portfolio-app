angular.module('portfolio.services', [])

/**
 * Artworks respository
 */
.factory('ArtworkProvider', function artworkProviderFactory(LocalStorageProvider) {

    var arts;

    return {
        init: function() {
            arts = LocalStorageProvider.getArtworksData();
        },

        all: function() {
            return arts;
        },

        allByCollection: function(collection) {
            var artworks = [];
            if (collection && collection.artwork_ids.length > 0) {
                for (var i in collection.artwork_ids) {
                    artId = collection.artwork_ids[i];
                    artworks.push(this.findById(artId));
                }
            }
            return artworks;
        },

        findById: function(id) {
            artwork = null;
            arts.map(function(a) {
                if (a.id == id) artwork = a;
            });
            return artwork;
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
.factory('RemoteDataProvider', function remoteDataProvider($http, LocalStorageProvider) {

    var apikey = '19957ec02e669s11e3ab523a0800270f67ea';
    var webservices = {
        auth: 'https://www.artfinder.com/api/v1/artist/$USER$/',
        artworks: 'https://www.artfinder.com/api/v1/product/$USER$/',
        collections: 'https://www.artfinder.com/api/v1/collection/$USER$/'
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
            console.log(url);
            return $http.get(url, {
                responseType: 'blob',
                cache: false,
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
        }
    };

})

/**
 * A service that manipulates with local storage
 */
.factory('LocalStorageProvider', function localStorageProvider() {

    var USER_KEY = 'username';
    var ARTWORKS_RAW_INDEX_KEY = 'raw_artworks';
    var ARTWORKS_INDEX_KEY = 'artworks';
    var COLLECTIONS_RAW_INDEX_KEY = 'raw_collections';
    var COLLECTIONS_INDEX_KEY = 'collections';

    return {
        // Setters
        saveUsername: function(username) {
            window.localStorage.setItem(USER_KEY, username);
        },
        saveArtworksData: function(data) {
            window.localStorage.setItem(ARTWORKS_INDEX_KEY, JSON.stringify(data));
        },
        saveRawArtworksData: function(data) {
            window.localStorage.setItem(ARTWORKS_RAW_INDEX_KEY, JSON.stringify(data));
        },
        saveCollectionsData: function(data) {
            window.localStorage.setItem(COLLECTIONS_INDEX_KEY, JSON.stringify(data));
        },
        saveRawCollectionsData: function(data) {
            window.localStorage.setItem(COLLECTIONS_RAW_INDEX_KEY, JSON.stringify(data));
        },

        // Getters
        getUsername: function() {
            return window.localStorage.getItem(USER_KEY);
        },
        getArtworksData: function() {
            return JSON.parse(window.localStorage.getItem(ARTWORKS_INDEX_KEY));
        },
        getRawArtworksData: function() {
            return JSON.parse(window.localStorage.getItem(ARTWORKS_RAW_INDEX_KEY));
        },
        getCollectionsData: function() {
            return JSON.parse(window.localStorage.getItem(COLLECTIONS_INDEX_KEY));
        },
        getRawCollectionsData: function() {
            return JSON.parse(window.localStorage.getItem(COLLECTIONS_RAW_INDEX_KEY));
        },

        // Removers
        removeRawArtworksData: function() {
            window.localStorage.removeItem(ARTWORKS_RAW_INDEX_KEY);
        },
        removeRawCollectionsData: function() {
            window.localStorage.removeItem(COLLECTIONS_RAW_INDEX_KEY);
        },
        purge: function() {
            window.localStorage.removeItem(USER_KEY);
            window.localStorage.removeItem(ARTWORKS_INDEX_KEY);
            window.localStorage.removeItem(ARTWORKS_RAW_INDEX_KEY);
            window.localStorage.removeItem(COLLECTIONS_INDEX_KEY);
            window.localStorage.removeItem(COLLECTIONS_RAW_INDEX_KEY);
        }
    };

})

/**
 * A service that manipulates with persistent storage
 */
.factory('PersistentStorageProvider', function persistentStorageProvider() {

    var DATADIR = 'artp';
    var QUOTA = 50*1024*1024; // 50MB

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
        console.log(error);
    };

    return {
        saveBlob: function(data, filename, callback) {
            requestStorage(function(dir) {
                dir.getFile(filename, { create: true }, function(file) {
                    file.createWriter(function(writer) {
                        writer.onwriteend = function(e) {
                            console.log(file.toURL());
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
                        console.log('Removing file: ' + files[i].toURL());
                        files[i].remove(function() {}, errorHandler);
                    }
                });

                dir.remove(function() {}, function() {}); //this will remove directory, but if it can not than will forgot about it

                callback();
            });
        }
    };

})

/**
 * A service for displaying user messages, alerts
 */
.factory('MessagesProvider', function messagesProvider($ionicPopup, $ionicLoading) {

    var singleArtworkViewOverlayEnabled = true;

    // A simple function to handle errors using friendly popup message
    return {
        alertPopup: function(message, title) {
            $ionicPopup.alert({
                title: title ? title : 'Oops',
                template: message,
                onTap: $ionicLoading.hide()
            });
        },
        displaySingleArtworkOverlay: function($scope) {
            if (singleArtworkViewOverlayEnabled) {
                $ionicLoading.show({
                     templateUrl: 'templates/artwork/swipingInstructionsOverlay.html',
                     scope: $scope,
                     //duration: 1000
                });
            }
        },
        hideSingleArtworkOverlay: function() {
            singleArtworkViewOverlayEnabled = false;
            $ionicLoading.hide();
        }
    };
});

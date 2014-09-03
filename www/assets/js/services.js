angular.module('portfolio.services', [])

/**
 * Artworks respository
 */
.factory('ArtworkProvider', function artworkProviderFactory(LocalStorageProvider) {

    var arts = LocalStorageProvider.getArtworksData();

    return {
        all: function() {
            return arts;
        },

        allByCollection: function(collection) {
            var artworks = [];
            for (var i in collection.artworks) {
                artId = collection.artworks[i];
                artworks.push(this.findById(artId));
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
.factory('CollectionProvider', function collectionProviderFactory() {

    // TODO: Collections to be fetched from local storage once API allows it
    var collections = [
        {
            id: 1,
            name: 'Large paintings',
            cover_image: {
                local_path: 'assets/samples/grid/06-grid.jpg'
            },
            artworks: [2,4,6,8]
        },
        {
            id: 2,
            name: 'Small paintings',
            cover_image: {
                local_path: 'assets/samples/grid/05-grid.jpg'
            },
            artworks: [1,3,5,7]
        },
        {
            id: 3,
            name: 'Colorful',
            cover_image: {
                local_path: 'assets/samples/grid/07-grid.jpg'
            },
            artworks: [7,5,1]
        },
        {
            id: 4,
            name: 'Black and white',
            cover_image: {
                local_path: 'assets/samples/grid/08-grid.jpg'
            },
            artworks: [8,6,4,2,1]
        }
    ];

    return {

        all: function() {
            return collections;
        },

        findById: function(id) {
            collection = null;
            collections.map(function(c) {
                if (c.id == id) {
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
    var artworks_webservice_url = 'https://www.artfinder.com/api/v1/product/$USER$/';
    var collections_webservice_url = 'https://www.artfinder.com/api/v1/product/$USER$/'; // Temporary URL until proper webservice is in place
    // var collections_webservice_url = 'https://www.artfinder.com/api/v1/collection/$USER$/';

    var getUrl = function(url, username) {
        return url.replace('$USER$', username);
    };

    return {
        fetchArtworksForUser: function(username) {
            return $http.get(getUrl(artworks_webservice_url, username), {
                params: { api_key: apikey }
            });
        },
        fetchCollectionsForUser: function(username) {
            return $http.get(getUrl(collections_webservice_url, username), {
                params: { api_key: apikey }
            });
        },
        fetchBlob: function(url) {
            // Dirty workaround for access-origin errors
            url = url.replace('d30dcznuokq8w8.cloudfront.net', 's3.amazonaws.com/artfinder');
            console.log(url);
            return $http.get(url, {
                responseType: 'blob',
                cache: false
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

        // Removers
        removeRawArtworksData: function() {
            window.localStorage.removeItem(ARTWORKS_RAW_INDEX_KEY);
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

    // Request persistent storage the old-fashined way - useful for in-browser testing
    // TODO: Refactor this later to use proper Cordova File plugin methods
    var requestStorage = function(callback) {
        // Watch out for quota!
        window.webkitStorageInfo.requestQuota(window.PERSISTENT, 50*1024*1024, function(grantedBytes) {
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(window.PERSISTENT, grantedBytes, function(fileSystem) {
                fileSystem.root.getDirectory(DATADIR, { create: true },
                    callback,
                    errorHandler
                );
            }, errorHandler);
        });
    };

    var errorHandler = function(error) {
        console.log('Persistent storage error: ' + error.name);
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
                dir.removeRecursively(callback, errorHandler);
            });
        }
    };

});

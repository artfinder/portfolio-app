angular.module('portfolio.services', [])

.factory('ArtworkProvider', function artworkProviderFactory() {

    // Temporary set of artwork models
    var artsToBeFetchedFromStorage = [
        {
            id: 1,
            cover_image: {
                local_path: 'assets/samples/grid/01-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/01-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/01-grid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/08-fluid.jpg'
                }
            ],
            title: 'Golden light',
            category: 'Acrylic painting',
            price: '99'
        },
        {
            id: 2,
            cover_image: {
                local_path: 'assets/samples/grid/02-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/02-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/02-grid.jpg'
                }
            ],
            title: 'Jula',
            category: 'Oil painting',
            price: '20'
        },
        {
            id: 3,
            cover_image: {
                local_path: 'assets/samples/grid/03-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/03-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/03-grid.jpg'
                }
            ],
            title: 'Birdie',
            category: 'Watercolour',
            price: '150'
        },
        {
            id: 4,
            cover_image: {
                local_path: 'assets/samples/grid/04-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/04-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/04-grid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/03-fluid.jpg'
                }
            ],
            title: 'Shoreline',
            category: 'Abstract',
            price: '199'
        },
        {
            id: 5,
            cover_image: {
                local_path: 'assets/samples/grid/05-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/05-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/05-grid.jpg'
                }
            ],
            title: 'Kittie',
            category: 'Acrylic painting',
            price: '500'
        },
        {
            id: 6,
            cover_image: {
                local_path: 'assets/samples/grid/06-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/06-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/06-grid.jpg'
                }
            ],
            title: 'Donald Duck',
            category: 'Dustcolour',
            price: '10'
        },
        {
            id: 7,
            cover_image: {
                local_path: 'assets/samples/grid/07-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/07-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/07-grid.jpg'
                }
            ],
            title: 'Mickey Mouse',
            category: 'Watercolour',
            price: '80'
        },
        {
            id: 8,
            cover_image: {
                local_path: 'assets/samples/grid/08-fluid.jpg'
            },
            images: [
                {
                    type: 'fluid',
                    local_path: 'assets/samples/grid/08-fluid.jpg'
                },
                {
                    type: 'grid',
                    local_path: 'assets/samples/grid/08-grid.jpg'
                }
            ],
            title: 'Banana Split',
            category: 'Food painting',
            price: '666'
        }
    ];

    var arts = [];

    // Initialize artworks
    // TODO: Fetch from storage provider
    arts = artsToBeFetchedFromStorage;

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
            console.log(artsIndex);
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

.factory('CollectionProvider', function collectionProviderFactory() {

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
});

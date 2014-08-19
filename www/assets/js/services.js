angular.module('portfolio.services', [])

.factory('Artworks', function() {
    var arts = [
        {
            id: 1,
            images: {
                grid: 'assets/samples/grid/01-grid.jpg',
                fluid: 'assets/samples/grid/01-fluid.jpg'
            },
            title: 'Golden light',
            category: 'Acrylic painting',
            price: '99'
        },
        {
            id: 2,
            images: {
                grid: 'assets/samples/grid/02-grid.jpg',
                fluid: 'assets/samples/grid/02-fluid.jpg'
            },
            title: 'Jula',
            category: 'Oil painting',
            price: '20'
        },
        {
            id: 3,
            images: {
                grid: 'assets/samples/grid/03-grid.jpg',
                fluid: 'assets/samples/grid/03-fluid.jpg'
            },
            title: 'Birdie',
            category: 'Watercolour',
            price: '150'
        },
        {
            id: 4,
            images: {
                grid: 'assets/samples/grid/04-grid.jpg',
                fluid: 'assets/samples/grid/04-fluid.jpg'
            },
            title: 'Shoreline',
            category: 'Abstract',
            price: '199'
        },
        {
            id: 5,
            images: {
                grid: 'assets/samples/grid/05-grid.jpg',
                fluid: 'assets/samples/grid/05-fluid.jpg'
            },
            title: 'Kittie',
            category: 'Acrylic painting',
            price: '500'
        },
        {
            id: 6,
            images: {
                grid: 'assets/samples/grid/06-grid.jpg',
                fluid: 'assets/samples/grid/06-fluid.jpg'
            },
            title: 'Donald Duck',
            category: 'Dustcolour',
            price: '10'
        },
        {
            id: 7,
            images: {
                grid: 'assets/samples/grid/07-grid.jpg',
                fluid: 'assets/samples/grid/07-fluid.jpg'
            },
            title: 'Mickey Mouse',
            category: 'Watercolour',
            price: '80'
        },
        {
            id: 8,
            images: {
                grid: 'assets/samples/grid/08-grid.jpg',
                fluid: 'assets/samples/grid/08-fluid.jpg'
            },
            title: 'Banana Split',
            category: 'Food painting',
            price: '666'
        }
    ];

    var ids = [];
    var currentIdx = null;

    arts.map(function(a){
        ids.push(a.id);
    });

    return {
        all: function() {
            return arts;
        },

        findById: function(id) {
            art = null;
            arts.map(function(a) {
                if (a.id == id) {
                    art = a;
                    currentIdx = ids.indexOf(Number(id));
                }
            });
            return art;
        },

        nextId: function() {
            nextIdx = ids.length == currentIdx+1 ? 0 : currentIdx+1;
            return ids[nextIdx];
        },

        prevId: function() {
            prevIdx = currentIdx === 0 ? ids.length-1 : currentIdx-1;
            return ids[prevIdx];
        },

        next: function() {
            return this.findById(this.nextId);
        },

        prev: function() {
            return this.findById(this.prevId);
        }
    };
});

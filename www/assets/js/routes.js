angular.module('portfolio.routes', [])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    /*
     * Main application routes
     */

    .state('portfolio', {
        url: '/portfolio',
        abstract: true,
        templateUrl: 'templates/abstract/sidemenu.html',
        controller: 'AppController'
    })

    .state('portfolio.artworks', {
      url: '/artworks',
      views: {
        'main-content': {
            templateUrl: 'templates/artworks.html',
            controller: 'ArtworksController'
        }
      }
    })

    .state('portfolio.collections', {
      url: '/collections',
      views: {
        'main-content': {
            templateUrl: 'templates/collections.html',
            controller: 'CollectionsController'
        }
      }
    })

    .state('portfolio.bycollection', {
      url: '/by-collection/:collectionId',
      views: {
        'main-content': {
            templateUrl: 'templates/artworks.html',
            controller: 'ArtworksController'
        }
      }
    })

    .state('portfolio.subscriber', {
      url: '/subscriber',
      views: {
        'main-content': {
            templateUrl: 'templates/subscriber.html',
            controller: 'AppController'
        }
      }
    })

    .state('portfolio.settings', {
      url: '/settings',
      views: {
        'main-content': {
            templateUrl: 'templates/settings.html'
        }
      }
    })

    /*
     * Single artwork route
     */

    .state('artwork', {
        url: '/artwork',
        abstract: true,
        templateUrl: 'templates/abstract/artwork.html',
        controller: 'AppController'
    })

    .state('artwork.artwork', {
      url: '/:artId/:ref/:refId',
      views: {
        'artwork-content': {
            templateUrl: 'templates/artwork/main.html',
            controller: 'ArtworkDetailsController'
        }
      }
    })


    /*
     * User introduction/login routes
     */

    .state('intro', {
        url: '/intro',
        abstract: true,
        templateUrl: 'templates/abstract/intro.html',
        controller: 'IntroController'
    })

    .state('intro.welcome', {
        url: '/welcome',
        views: {
            'intro-content': {
                templateUrl: 'templates/intro/01-welcome.html',
                controller: 'LoginController'
            }
        }
    })

    // TODO: Possibly obsolete route/view since intro.welcome is now a slider view
    // handling two pages at once.
    .state('intro.login', {
        url: '/login',
        views: {
            'intro-content': {
                templateUrl: 'templates/intro/02-login.html'
            }
        }
    })

    .state('intro.fetch', {
        url: '/fetch',
        views: {
            'intro-content': {
                templateUrl: 'templates/intro/03-fetch.html',
                controller: 'FetcherController'
            }
        }
    })

    .state('intro.complete', {
        url: '/complete',
        views: {
            'intro-content': {
                templateUrl: 'templates/intro/04-complete.html'
            }
        }
    });

  // Default route
  $urlRouterProvider.otherwise("/portfolio/artworks");
});

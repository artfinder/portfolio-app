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
      url: '/artworks/:artId',
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
      url: '/by-collection/:collectionSlug/:artId',
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
    
    .state('portfolio.updateArtworks', {
      url: '/update-artworks',
      views: {
        'main-content': {
            templateUrl: 'templates/update-data.html',
            controller: 'RefreshArtworksController'
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

    .state('artwork-fullscreen', {
      url: '/artwork-fs/:artId/:index',
      templateUrl: 'templates/artwork-full-screen.html',
      controller: 'ArtworkFullscreenController'
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
    
    .state('intro.login_user', {
        url: '/login/:slug/:code',
        views: {
            'intro-content': {
                //templateUrl: 'templates/intro/01-welcome.html',
                templateUrl: 'templates/login-user-by-url.html',
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
                templateUrl: 'templates/intro/04-complete.html',
                controller:	 'DonwloadCompletedController'
            }
        }
    })

    .state('start', {
        url: '/start',
        templateUrl: 'templates/splash-screen.html',
        controller: 'SplashScreenController'
    });

  // Default route
  $urlRouterProvider.otherwise("/start");
});

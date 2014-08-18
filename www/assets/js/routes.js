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
        controller: 'AppCtrl'
    })

    .state('portfolio.artworks', {
      url: '/artworks',
      views: {
        'main-content': {
            templateUrl: 'templates/artworks.html',
            controller: 'ArtworksCtrl'
        }
      }
    })

    .state('portfolio.artwork', {
      url: '/artwork/:artId',
      views: {
        'main-content': {
            templateUrl: 'templates/artwork.html',
            controller: 'ArtworkDetailsCtrl'
        }
      }
    })

    .state('portfolio.collections', {
      url: '/collections',
      views: {
        'main-content': {
            templateUrl: 'templates/collections.html'
        }
      }
    })

    .state('portfolio.subscriber', {
      url: '/subscriber',
      views: {
        'main-content': {
            templateUrl: 'templates/subscriber.html'
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
     * User introduction routes (new/logged out user)
     */

    .state('intro', {
        url: '/intro',
        abstract: true,
        templateUrl: 'templates/abstract/intro.html',
        controller: 'IntroCtrl'
    })

    .state('intro.welcome', {
        url: '/welcome',
        views: {
            'intro-content': {
                templateUrl: 'templates/intro/01-welcome.html'
            }
        }
    })

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
                templateUrl: 'templates/intro/03-fetch.html'
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

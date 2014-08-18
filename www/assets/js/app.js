
// angular.module is a global place for creating, registering and retrieving Angular modules
// 1st parameter is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('portfolio', [
  'ionic',
  'ui.router',
  'ui.router.compat',
  'portfolio.routes',
  'portfolio.controllers',
  'portfolio.services'
])

.run(function($ionicPlatform, $location) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
    // $location.path('/intro/welcome');
  });
});

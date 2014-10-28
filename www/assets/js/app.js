
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

.config([
  // A workaround to display images stored in local filesystem (useful for in-browser testing)
  // http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page
  '$compileProvider',
  function($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|filesystem):|data:image\//);
  }
])

.run(function($ionicPlatform, $state, LocalStorageProvider) {

  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    // if (window.cordova && window.cordova.plugins.Keyboard) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    // }

    // iOS statusbar tweaks
    // if (window.StatusBar) {
    //   StatusBar.styleDefault();
    //   StatusBar.overlaysWebView(true);
    // }
  });
});

/**
 * Function for handling external URLs
 * @see http://calendee.com/2014/05/12/custom-urls-in-ionic-cordova-apps/
 * @param url
 */
function handleOpenURL(url) {
  var supportedIonContent = document.getElementsByClassName('splash-screen-info')[0];
  if (!supportedIonContent) {
    supportedIonContent = document.getElementsByClassName('login-main-content')[0];
  }

  /* this is designed to work only on splash-screen (initial) and login-form pages
     on other pages it should not be executed */
  if (supportedIonContent) {
	var gup = function(url, param) {
      param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regex = new RegExp("[\\?&]" + param + "=([^&#]*)");
      var results = regex.exec(url);
      return (results == null) ? null : results[1]; 
    }
	
	var slug = gup(url, 'slug');
	var code = gup(url, 'code');
	
	if (slug && code) {
      var supportedController = angular.element(supportedIonContent).scope();
      supportedController.reportAppLaunched({ slug: slug, code: code });
	}
  }
}
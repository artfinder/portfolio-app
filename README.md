Artfinder Portfolio application for Android and iOS based on Ionic Framework and Apache Cordova.

## Running project locally - quickstart guide

This is a short guide to setup Artfinder Portfolio project locally. The aim is to use Ionic Framework's CLI tools to run the project in a browser, which is the quickest way to develop front-end for the application.

### Install Ionic Framework

Ionic Framework helps creating hybird mobile apps relatively quickly using web development technologies. It heavily relies on AngularJS - in fact the app is an Angular app which uses a number of custom Ionic extensions on top of it. Normally Ionic Framework works with Cordova/Phonegap which is - generally speaking - a platform that bridges html/js/css-based hybrid apps with mobile operating system like Android or iOS. However, for the purpose of sole front-end development, running an app locally in browser without connecting an actual device should suffice.

Installing Ionic Framework locally is pretty simple. Make sure that you have node.js installed locally and then run:

    sudo npm install -g ionic

### Run project

Once Ionic is installed, switch to a directory where project is saved and execute:

    ionic serve

This command will run a micro-http server on a local port (usually ``http://localhost:8100/``) and open a Chrome browser window with an app running within it.

That's it! That's all needed to run Artfinder Portfolio app locally in a browser window.

### Known issues

#### Unable to download images from remote webservice

Fetching data from remote webservice is likely to fail with following error message visible in browser's console log:

    XMLHttpRequest cannot load https://s3.amazonaws.com/artfinder/thumbnails/w/500/h/500/q/85/product/3/b/f82e600697ab45ba6aec5e87414e44.jpg. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:8100' is therefore not allowed access.

Apparently this is related with a ``localhost`` not being allowed to fetch data from webservice, as this issue does not occur on a device connected to the internet hence using public host/IP address.

As a workaround we use [Ripple Emulator](https://chrome.google.com/webstore/detail/ripple-emulator-beta/geelfhphabnejjhdalkjhgipohgpdnoc) extension for Chrome browser which uses remote proxy for all XHR requests, which in turn allows bypassing the issue.

#### Quota for local storage exceeded

Run the following in Google Chrome's console:

    webkitStorageInfo.requestQuota(webkitStorageInfo.PERSISTENT, 1024*1024*100, function(e) { console.log('success'); }, function(e) { console.log('failure'); });

It should return ``success`` if the permission was granted.


## Application structure

Artfinder Portfolio app is in fact an AngularJS application. Source code is stored in `www` directory which has following structure:

    assets/
        css/
        icon/
        js/
        samples/ --> obsolete
    lib/
        ionic/
    templates/
        abstract/
        artwork/
        ...

From FED perspective `templates/` directory is quite obvious destination, however in order to understand how templates are laid out in the application, it's worth checking `assets/js/routes.js` file which defines which URL is driven by which controller (see `controllers.js`) and which template. The code, alas fairly ugly at places, should be relatively self-explanatory.

Custom stylesheet for the application is stored in `assets/css/main.css`.

Any new assets required to be included into project should be appropriately linked in the `index.html` file.

### Application styling

At the time of writing, the application's appearance is fairly rudimentary and uses default Ionic's components. See documentation: http://ionicframework.com/docs/components/


## Other information

### Backdoor password

For the purpose of quicker development and testing, the backdoor password (verification code) has been implemented to allow bypassing user's verification code. The password is `zoya`, it will be removed for production build.

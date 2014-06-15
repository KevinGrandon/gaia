'use strict';
/* global __dirname */

var assert = require('assert');

var Collection = require('./lib/collection');
var Home2 = require('./lib/home2');
var Server = require('../../../../shared/test/integration/server');
var System = require('../../../../apps/system/test/marionette/lib/system');

marionette('Vertical - Collection', function() {

  var client = marionette.client(Home2.clientOptions);
  var actions, collection, home, selectors, server, system;

  suiteSetup(function(done) {
    Server.create(__dirname + '/fixtures/everythingme/', function(err, _server) {
      server = _server;
      done();
    });
  });

  suiteTeardown(function() {
    server.stop();
  });

  setup(function() {
    //actions = new Actions(client);
    selectors = Home2.Selectors;
    collection = new Collection(client);
    home = new Home2(client);
    system = new System(client);
    system.waitForStartup();

    client.apps.launch(Home2.URL);

    home.waitForLaunch();

    // Disable Geolocation prompt
    var chromeClient = client.scope({ context: 'chrome' });
    chromeClient.executeScript(function(origin) {
      var mozPerms = navigator.mozPermissionSettings;
      mozPerms.set(
        'geolocation', 'deny', origin + '/manifest.webapp', origin, false
      );
    }, [Collection.URL]);

    // Update eme server settings
    chromeClient.executeScript(function(url) {
      navigator.mozSettings.createLock().set({
        'partners.api.url': url
      });
    }, [server.url('{resource}')]);
  });

  test('create collections', function() {
    collection.enterCreateScreen();
client.waitFor(function() {})
  });

});

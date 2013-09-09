var assert = require('assert');

/**
 * Abstraction around browser app.
 * @constructor
 * @param {Marionette.Client} client for operations.
 */
function Settings(client) {
  this.client = client;
}

/**
 * @type String Origin of browser app
 */
Settings.URL = 'app://settings.gaiamobile.org';

Settings.Selectors = {
  back: 'section.current header .icon-back',
  help: '#menuItem-help',
  helpUserGuide: 'section#help.current ul li label button',
  improve: '#menuItem-improveBrowserOS',
  improveSendFeedback: 'section#improveBrowserOS.current ul li label button',
  improveSubmitDataInput: 'input[name="debug.performance_data.shared"]',
  improveSubmitDataSpan: 'input[name="debug.performance_data.shared"] + span'
};

/**
 * @private
 * @param {Marionette.Client} client for selector.
 * @param {String} name of selector [its a key in Settings.Selectors].
 */
function findElement(client, name) {
  return client.findElement(Settings.Selectors[name]);
}

Settings.prototype = {

  /**
   * Presses the back button
   */
  back: function() {
    return findElement(this.client, 'back').click();
  },

  /**
   * Presses the back button and runs an assertion
   */
  assertReturn: function() {
    this.back();
    this.client.helper.waitForElement('#root.current');
    assert.ok(true, 'Returned to index.');
  },

  goToScreen: function(screen) {
    var selector = Settings.Selectors[screen];
    this.client.helper.waitForElement(selector);
    this.client.findElement(selector).click();
    this.client.helper.waitForElement(
      selector.replace(/menuItem-/, '') + ' header');
  },

  /**
   * Launches browser app and focuses on frame.
   */
  launch: function() {
    this.client.apps.launch(Settings.URL);
    this.client.apps.switchToApp(Settings.URL);
  },

  relaunch: function() {
    this.client.apps.close(Settings.URL);
    this.launch();
  }
};

module.exports = Settings;

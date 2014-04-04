'use strict';
/* global SettingsListener, Rocketbar */

(function(exports) {

  /**
   * RocketbarLauncher handles launching and enabling of the Rocketbar
   * and search window.
   */
  function RocketbarLauncher() {

  }

  RocketbarLauncher.prototype = {
    instance: null,

    enabled: false,

    get origin() {
      // We don't really care the origin of rocketbar,
      // and it may change when we swap the homescreen app.
      // So we use a fixed string here.
      // See HomescreenLauncher and http://bugzil.la/913323
      return 'rocketbar';
    },

    show: function() {
      this.instance.expand();
    },

    start: function() {
      SettingsListener.observe('rocketbar.searchAppURL', false,
      function(url) {
        var searchAppURL = url;
        var searchManifestURL = url.match(/(^.*?:\/\/.*?\/)/)[1] +
          'manifest.webapp';

        this.instance = new Rocketbar(searchAppURL, searchManifestURL);
        this.instance.start();
      }.bind(this));

      SettingsListener.observe('rocketbar.enabled', false,
      function(value) {
        if (!this.instance) {
          return;
        }

        this.enabled = value;

        if (value) {
          this.instance.enable();
        } else {
          this.instance.disable();
        }
        this.enabled = value;
      }.bind(this));
    }
  };

  exports.RocketbarLauncher = RocketbarLauncher;

}(window));

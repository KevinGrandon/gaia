'use strict';
/* global newtab */

(function(exports) {

  function PrivateBrowsing() {
    this.trigger = document.getElementById('private-window');
    this.trigger.addEventListener('click', this);
  }

  PrivateBrowsing.prototype = {

    /**
     * General event handler.
     * Currently dispatches a request to open a new private window
     * from the newtab object.
     */
    handleEvent: function(e) {
      newtab.requestPrivateWindow();
      e.preventDefault();
    }

  };

  window.privateBrowsing = new PrivateBrowsing();

})(window);

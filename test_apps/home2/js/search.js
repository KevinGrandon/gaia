(function() {
  'use strict';

  function Search() {
    this._port = null;
    this.connected = false;
    this.pendingRender = false;

    var self = this;
    navigator.mozApps.getSelf().onsuccess = function() {
      var app = this.result;
      app.connect('search-results').then(
        function onConnectionAccepted(ports) {
          ports.forEach(function(port) {
            self._port = port;
          });
          self.connected = true;
          if (self.pendingRender) {
            self.open();
          }
        },
        function onConnectionRejected(reason) {
          dump('Error connecting: ' + reason + '\n');
        }
      );
    };

    var input = document.getElementById('search');
    input.addEventListener('touchstart', this.open.bind(this))
  }

  Search.prototype = {

    /**
     * Sends a message to open the rocketbar.
     */
    open: function openRocketbar(e) {
      e.stopPropagation();
      e.preventDefault();
console.log('OPENING requested!');
      if (!this.connected) {
        this.pendingRender = true;
        return;
      }
console.log('posting render message!!', this._port);
      this._port.postMessage({action: 'render'});
    }
  };

  var search = new Search();

})();

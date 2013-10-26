(function(exports) {

  var Sheet = {

    /**
     * Returns any arguments passed to the current sheet.
     */
    get args() {
      delete this.args;
      var argParts = location.href.split('#')[1].split('/');
      var args = {};
      for (var i = 0, iLen = argParts.length; i < iLen; i++) {
        args[argParts[i]] = argParts[(++i)];
      }
      this.args = args;
      return args;
    },

    /**
     * Opens a sheet based on a path.
     * @param {String} path to the sheet HTML file.
     * @param {Object} args to send to the new page in the URL.
     */
    open: function(path, args) {

      if (args) {
        path += '#';
        for (var i in args) {
          path += i + '/' + args[i];
        }
      }

      var frame = document.createElement('iframe');
      frame.src = path;
      frame.style = 'height: 100%; width: 100%; ' +
        'position: absolute; top: 0; left: 0; z-index: 10000;';
      document.body.appendChild(frame);
    },

    /**
     * Closes the current sheet.
     * Called by a child to close it's own sheet.
     * TODO: Will eventually be something like window.close();
     */
    close: function() {
      if (parent !== window) {
        dump(location.href);
        parent.sheet._removeBySrc(location.pathname);
      }
    },

    /**
     * Helper method to remove a sheet in this panel.
     */
    _removeBySrc: function(src) {
      var iframe = document.querySelector('iframe[src^="' + src + '"]');
      document.body.removeChild(iframe);
    }
  };

  exports.sheet = Sheet;

}(window));

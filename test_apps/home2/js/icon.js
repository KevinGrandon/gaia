'use strict';

(function(exports) {
  // Icon container
  var container = document.getElementById('icons');

  /**
   * Represents a single app icon on the homepage.
   */
  function Icon(app, entryPoint) {
    this.app = app;
    this.entryPoint = entryPoint;

    this.detail = {
      type: 'app',
      manifestURL: app.manifestURL,
      entryPoint: entryPoint,
      index: 0
    };
  }

  Icon.prototype = {

    /**
     * Returns the height in pixels of each icon.
     */
    get pixelHeight() {
      return app.zoom.gridItemHeight;
    },

    /**
     * Width in grid units for each icon.
     */
    gridWidth: 1,

    get name() {
      var name = this.descriptor.name;
      var userLang = document.documentElement.lang;

      if (name[userLang]) {
        return name[userLang];
      }
      return name;
    },

    get icon() {
      if (!this.descriptor.icons) {
        return '';
      }

      var lastIcon = 0;
      for (var i in this.descriptor.icons) {
        if (i > lastIcon) {
          lastIcon = i;
        }
      }

      var icon = this.descriptor.icons[lastIcon];

      // Handle relative URLs
      if (!UrlHelper.hasScheme(icon)) {
        var a = document.createElement('a');
        a.href = this.app.origin;
        icon = a.protocol + '//' + a.host + icon;
      }

      return icon;
    },

    get descriptor() {
      var manifest = this.app.manifest || this.app.updateManifest;

      if (this.entryPoint) {
        return manifest.entry_points[this.entryPoint];
      }
      return manifest;
    },

    get identifier() {
      var identifier = [this.app.origin];

      if (this.entryPoint) {
        identifier.push(this.entryPoint);
      }

      return identifier.join('-');
    },

    /**
     * Sets the item position
     */
    setPosition: function(position) {
      this.detail.index = position;
    },

    /**
     * Renders the icon to the container.
     * @param {Object} coordinates Grid coordinates to render to.
     * @param {Number} index The index of the items list of this item.
     */
    render: function(coordinates, index) {
      var x = coordinates.x * app.zoom.gridItemWidth;
      var y = app.zoom.offsetY;

      // Generate the tile if we need to
      if (!this.tile) {
        var tile = document.createElement('div');
        tile.className = 'icon';
        tile.dataset.identifier = this.identifier;
        tile.style.backgroundImage = 'url(' + this.icon + ')';

        var nameEl = document.createElement('span');
        nameEl.className = 'title';
        nameEl.textContent = this.name;
        tile.appendChild(nameEl);

        this.tile = tile;

        container.appendChild(tile);
      }

      this.setPosition(index);
      this.x = x;
      this.y = y;
      this.scale = app.zoom.percent;

      // Avoid rendering the icon during a drag to prevent jumpiness
      if (this.noRender) {
        return;
      }

      this.transform(x, y, app.zoom.percent);
    },

    /**
     * Positions and scales an icon.
     */
    transform: function(x, y, scale) {
      scale = scale || 1;
      this.tile.style.transform =
        'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
    },

    /**
     * Launches the application for this icon.
     */
    launch: function() {
      if (this.entryPoint) {
        this.app.launch(this.entryPoint);
      } else {
        this.app.launch();
      }
    }
  };

  exports.Icon = Icon;

}(window));

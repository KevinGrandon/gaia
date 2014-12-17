/* global Provider */

'use strict';

function DataGridProvider() {
}

DataGridProvider.prototype = {

  __proto__: Provider.prototype,

  name: 'DataGridProvider',

  /**
   * A cache of the last rendered results. This is updated after we render a
   * new set of results to the grid. This is useful for having a list of
   * exactly what this provider has rendered to the grid.
   */
  resultCache: [],

  init: function() {
    this.grid = document.getElementById('icons');
  },

  clear: function() {
    this.grid.clear();
  },

  render: function(results) {
    var renderedGridIds = {};

    results.forEach(function(config, index) {
      var newIcon = config.data;
      renderedGridIds[newIcon.identifier] = true;

      // If we already have an existing icon in the grid, return.
      var existingIcon = this.grid.getIcon(newIcon.identifier);
      if (existingIcon) { return; }

      // Otherwise we add it to the grid
      this.grid.add(newIcon);
    }, this);

    // Now remove all results of this type which do not exist in the grid.
    if (this.resultCache.length) {
      for (var i = 0, iLen = this.resultCache.length; i < iLen; i++) {
        var cached = this.resultCache[i].data;
        if (!renderedGridIds[cached.identifier]) {
          var icon = this.grid.getIcon(cached.identifier);
          console.log('Removing item: ',icon.identifier,icon.detail.index)
          this.grid.removeIconByIdentifier(icon.identifier);
          this.grid.removeItemByIndex(icon.detail.index);
        }
      }
    }
    this.resultCache = results;

    this.grid.render({
      skipDivider: true
    });
  }
};

'use strict';
/* global Divider */
/* global DragDrop */
/* global Icon */
/* global Zoom */

(function(exports) {

  // For now we inject a divider every few icons for testing.
  var tempDivideEvery = 6;
  var tempCurrent = 0;

  // Hidden manifest roles that we do not show
  const HIDDEN_ROLES = ['system', 'keyboard', 'homescreen', 'search'];

  function App() {
    this.zoom = new Zoom();
    this.dragdrop = new DragDrop();

    this.container = document.getElementById('icons');
    this.iconLaunch = this.clickIcon.bind(this);
  }

  App.prototype = {

    HIDDEN_ROLES: HIDDEN_ROLES,

    /**
     * List of all application icons.
     * Maps an icon identifier to an icon object.
     */
    icons: {},

    /**
     * Lists of all displayed objects in the homescreen.
     * Includes app icons, dividers, and bookmarks.
     */
    items: [],

    /**
     * Adds an item into the items array.
     * If the item is an icon, add it to icons.
     */
    addItem: function(item) {
      this.items.push(item);

      if (item instanceof Icon) {
        this.icons[item.identifier] = item;
      }
    },

    /**
     * Fetch all icons and render them.
     */
    init: function() {
      this.itemStore = new ItemStore();
      this.itemStore.all(function _all(results) {
        results.forEach(function _eachResult(result) {
          this.addItem(result);
        }, this);
        this.render();
        this.start();
      }.bind(this));
    },

    start: function() {
      this.container.addEventListener('click', this.iconLaunch);
    },

    stop: function() {
      this.container.removeEventListener('click', this.iconLaunch);
    },

    /**
     * Scrubs the list of items, removing empty sections.
     */
    cleanItems: function() {
      var appCount = 0;
      var toRemove = [];

      this.items.forEach(function(item, idx) {
        if (item instanceof Divider) {
          if (appCount === 0) {
            toRemove.push(idx);
          }
          appCount = 0;
        } else {
          appCount++;
        }
      }, this);

      toRemove.reverse();
      toRemove.forEach(function(idx) {
        var removed = this.items.splice(idx, 1)[0];
        removed.remove();
      }, this);

      // There should always be a divider at the end, it's hidden in CSS when 
      // not in edit mode.
      var lastItem = this.items[this.items.length - 1];
      if (!(lastItem instanceof Divider)) {
        this.items.push(new Divider());
      }
    },

    /**
     * Renders all icons.
     * Positions app icons and dividers accoriding to available space
     * on the grid.
     */
    render: function() {

      app.cleanItems();

      // Reset offset steps
      this.zoom.offsetY = 0;

      // Grid render coordinates
      var x = 0;
      var y = 0;

      /**
       * Steps the y-axis.
       * @param {Object} item
       */
      function step(item) {
        app.zoom.stepYAxis(item.pixelHeight);

        x = 0;
        y++;
      }

      this.items.forEach(function(item, idx) {

        // If the item would go over the boundary before rendering,
        // step the y-axis.
        if (x > 0 && item.gridWidth > 1 &&
            x + item.gridWidth >= this.zoom.perRow) {
          // Step the y-axis by the size of the last row.
          // For now we just check the height of the last item.
          var lastItem = this.items[idx - 1];
          step(lastItem);
        }

        item.render({
          x: x,
          y: y
        }, idx);

        // Increment the x-step by the sizing of the item.
        // If we go over the current boundary, reset it, and step the y-axis.
        x += item.gridWidth;
        if (x >= this.zoom.perRow) {
          step(item);
        }
      }, this);
    },

    /**
     * Launches an app.
     */
    clickIcon: function(e) {
      var container = e.target;
      var identifier = container.dataset.identifier;
      var icon = this.icons[identifier];

      if (!icon) {
        return;
      }

      icon.launch();
    }
  };

  exports.app = new App();
  exports.app.init();

}(window));

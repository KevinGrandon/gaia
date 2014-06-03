'use strict';
/* global Divider */
/* global GridDragDrop */
/* global GridLayout */
/* global GridZoom */
/* global Icon */
/* global Placeholder */

(function(exports) {

  const PREVENT_CLICK_TIMEOUT = 300;

  /**
   * GridView is a generic class to render and display a grid of items.
   * @param {Object} config Configuration object containing:
   *  - element: The shadow root of the grid
   */
  function GridView(config) {
    this.config = config;
    this.clickIcon = this.clickIcon.bind(this);
    this.onScroll = this.onScroll.bind(this);

    if (config.features.zoom) {
      this.zoom = new GridZoom(this);
    }

    if (config.features.dragdrop) {
      this.dragdrop = new GridDragDrop(this);
    }

    this.layout = new GridLayout(this);

    // Enable event listeners when instantiated.
    this.start();
  }

  GridView.prototype = {
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
     * List of all visible displayed app icons in the homescreen.
     */
    visibleIcons: [],

    /**
     * Returns a reference to the gaia-grid element.
     */
    get element() {
      return this.config.element;
    },

    /**
     * Adds an item into the items array.
     * If the item is an icon, add it to icons.
     */
    add: function(item) {
      this.items.push(item);

      if (item.identifier) {
        this.icons[item.identifier] = item;
      }
    },

    start: function() {
      this.element.addEventListener('click', this.clickIcon);
      this.element.addEventListener('scroll', this.onScroll);
      this.calcVisibility();
    },

    stop: function() {
      this.element.removeEventListener('click', this.clickIcon);
      this.element.removeEventListener('scroll', this.onScroll);
    },

    onScroll: function(e) {
      this.element.classList.add('scrolling');
      this.element.removeEventListener('click', this.clickIcon);
      clearTimeout(this.preventClickTimeout);
      this.preventClickTimeout = setTimeout(function addClickEvent() {
        this.element.addEventListener('click', this.clickIcon);
        this.element.classList.remove('scrolling');
        this.calcVisibility();
      }.bind(this), PREVENT_CLICK_TIMEOUT);
    },

    /**
     * Launches an app.
     */
    clickIcon: function(e) {
      var container = e.target;
      var action = 'launch';

      if (e.target.classList.contains('remove')) {
        container = e.target.parentNode;
        action = 'remove';
      }

      var identifier = container.dataset.identifier;
      var icon = this.icons[identifier];

      if (!icon) {
        return;
      }

      // We do not allow users to launch icons in edit mode
      if (action === 'launch' && this.dragdrop && this.dragdrop.inEditMode) {
        if (icon.detail.type !== 'bookmark') {
          return;
        }
        // Editing a bookmark in edit mode
        action = 'edit';
      }

      icon[action]();
    },

    /**
     * Calculates whether an icon is visible or not and sets a CSS class
     * accordingly.
     */
    calcVisibility: function() {
      this.visibleIcons.forEach(function(item) {
        item.element.classList.remove('visible');
      }, this);
      this.visibleIcons = [];

      var visibleStart = this.element.scrollTop;
      var visibleEnd = visibleStart + this.element.clientHeight;
      var itemHeight = this.layout.gridItemHeight;
      this.items.forEach(function(item) {
        if (item instanceof Icon) {
          if (item.element.offsetTop + itemHeight > visibleStart &&
              item.element.offsetTop < visibleEnd) {
            item.element.classList.add('visible');
            this.visibleIcons.push(item);
          }
        }
      }, this);
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
     * Removes placeholders from the grid.
     */
    removeAllPlaceholders: function() {
      var toSplice = [];
      var previousItem;
      this.items.forEach(function(item, idx) {
        if (item instanceof Placeholder) {

          // If the previous item is a divider, and we are in edit mode
          // we do not remove the placeholder. This is so the section will
          // remain even if the user drags the icon around. Bug 1014982
          if (previousItem && previousItem instanceof Divider &&
              this.dragdrop && this.dragdrop.inDragAction) {
            return;
          }

          toSplice.push(idx);
        }

        previousItem = item;
      }, this);

      toSplice.reverse().forEach(function(idx) {
        var item = this.items[idx];
        item.element && item.element.parentNode.removeChild(item.element);
        this.items.splice(idx, 1);
      }, this);
    },

    /**
     * Creates placeholders and injects them into the grid.
     * @param {Array} coordinates [x,y] coordinates on the grid of the first
     * item in grid units.
     * @param {Integer} idx The position of the first placeholder.
     * @param {Integer} idx The number of placeholders to create.
     */
    createPlaceholders: function(coordinates, idx, count) {
      for (var i = 0; i < count; i++) {
        var itemCoords = [
          coordinates[0] + i,
          coordinates[1]
        ];

        var item = new Placeholder();
        this.items.splice(idx + i, 0, item);
        item.render(itemCoords, idx + i);
      }
    },

    /**
     * Renders all icons.
     * Positions app icons and dividers accoriding to available space
     * on the grid.
     * @param {Integer} from The index to start rendering from.
     * @param {Integer} to The index to continue rendering to.
     * @param {Boolean} useTransform Whether to use CSS transforms to position
     * grid items.
     */
    render: function(from, to, useTransform) {
      var self = this;

      // Start rendering from one before the drop target. If not,
      // we may drop over the divider and miss rendering an icon.
      from = (from > 0) ? from - 1 : 0;

      // Bounds-check the 'to' parameter.
      if ((!to && to != 0) || (to >= this.items.length)) {
        to = this.items.length - 1;
      }

      // Store the from and to indices as items, as removing placeholders/
      // cleaning will alter indexes.
      var fromItem = this.items[from];
      var toItem = this.items[to];

      this.removeAllPlaceholders();
      this.cleanItems();

      // Reset the to index until we find it again when iterating over items
      // below.
      to = this.items.length - 1;

      // Reset offset steps
      this.layout.offsetY = 0;

      // Grid render coordinates
      var x = 0;
      var y = 0;

      /**
       * Steps the y-axis.
       * @param {Object} item
       */
      function step(item) {
        self.layout.stepYAxis(item.pixelHeight);

        x = 0;
        y++;
      }

      for (var idx = 0; idx <= to; idx++) {
        var item = this.items[idx];
        // If the item would go over the boundary before rendering,
        // step the y-axis.
        if (x > 0 && item.gridWidth > 1 &&
            x + item.gridWidth >= this.layout.perRow) {

          // Insert placeholders to fill remaining space
          var remaining = this.layout.perRow - x;
          this.createPlaceholders([x, y], idx, remaining);

          // Increment the current index due to divider insertion
          idx += remaining;
          to += remaining;
          item = this.items[idx];

          // Step the y-axis by the size of the last row.
          // For now we just check the height of the last item.
          var lastItem = this.items[idx - (remaining + 1)];
          step(lastItem);
        }

        if (item == fromItem) {
          from = idx;
        }
        if (item == toItem) {
          to = idx;
        }

        // Check if idx is >= to also - there's a chance that decrementing from
        // at the beginning of this function means fromItem is a placeholder
        // or a removed divider.
        if (idx >= from || idx >= to) {
          item.render([x, y], idx, useTransform);
        }

        // Increment the x-step by the sizing of the item.
        // If we go over the current boundary, reset it, and step the y-axis.
        x += item.gridWidth;
        if (x >= this.layout.perRow) {
          step(item);
        }
      }
    }
  };

  exports.GridView = GridView;

}(window));

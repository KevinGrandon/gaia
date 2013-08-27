/**
 * A class which scrolls a list by cursor
 *  and batch renders as needed.
 * @param {Object} request object.
 */
function CursorScroll(request) {
  // Only a forward cursor on initial request
  this.setCursor(request, 'forward');

  this.forwardOffset = 0;
  this.backwardOffset = 0;

  // If we need to advance a cursor
  this.advanceCount = 0;

  this.forwardLastHeaderContent = null;
  this.backwardLastHeaderContent = null;
  this.dom = {
    lastHeader: null,
    forwardLastGroup: null,
    backwardLastGroup: null
  };

  this.elementHeight = this.element.getBoundingClientRect().height;
  this.element.addEventListener('scroll', this);
}

CursorScroll.prototype = {

  blockSize: 8,

  /**
   * Called when we need to continue a cursor
   * Child classes should overwrite this.
   */
  continue: function() {},

  setCursor: function(request, direction) {
    var group = [];
    request.onsuccess = (function forward_success(event) {
      var cursor = event.target.result;
      this[direction + 'Cursor'] = cursor;

      // Advance the cursor if needed (after a scroll)
      if (this.advanceCount > 0) {
        cursor.advance(this.advanceCount);
        this.advanceCount = 0;
        return;
      }

      if (cursor && cursor.value) {
        group.push(cursor.value.properties);

        if (group.length === this.blockSize) {
          this.renderBlock(group, direction);
          group = [];
        } else {
          this[direction + 'Offset']++;
          cursor.continue();
        }
      } else {
        this[direction + 'Cursor'] = null;
        this.renderBlock(group, direction);
      }
    }).bind(this);

    request.onerror = function() {
      alert('Contacts broke');
    };
  },

  reset: function() {

    this.forwardOffset = 0;
    this.backwardOffset = 0;

    this.backwardLastHeaderContent = null;
    this.forwardLastHeaderContent = null;
    scroller.element.scrollTop = 0;
    scroller.element.innerHTML = '';

    // Need to delete the old cursors or onsuccess still fires
    delete this.forwardCursor;
    delete this.backwardCursor;
  },

  handleEvent: function(e) {
    if (e.type === 'scroll') {
      this.checkScroll();
    }
  },

  /**
   * Generates a node for each item in the list.
   * @param {Object} Item data.
   * @return {String} Html string for each item.
   */
  itemNode: function(obj) {
    return '';
  },

  /**
   * Generates HTML for a header
   * @param {Object} Item data.
   * @return {String} Html string for each header.
   */
  headerFormat: function(item) {
    return item.toString();
  },

  /**
   * Determines if we need to add a new header
   * Adds a new header to the dom if we need to.
   */
  addForwardHeader: function(item) {
    var headerContent = this.headerFormat(item);
    if (this.forwardLastHeaderContent !== headerContent) {
      this.forwardLastHeaderContent = headerContent;
      this.dom.lastHeader = document.createElement('header');
      this.dom.lastHeader.innerHTML = headerContent;
      this.dom.forwardLastGroup.appendChild(this.dom.lastHeader);
    }
  },

  /**
   * Determines if we need to add a new header
   * Adds a new header to the dom if we need to.
   */
  addBackwardHeader: function(item, isLast) {
    var headerContent = this.headerFormat(item);

    if (!this.backwardLastHeaderContent) {
      this.backwardLastHeaderContent = headerContent;
    }

    // Render the header if the content differs
    // Or if there is no backwardCursor.
    // If there is no backwardCursor, then we've reached the end.
    if (this.backwardLastHeaderContent !== headerContent ||
        !this.backwardCursor && isLast) {
      var lastHeader = document.createElement('header');
      lastHeader.innerHTML = this.backwardLastHeaderContent;

      var parent = this.dom.backwardLastGroup;
      parent.insertBefore(lastHeader, parent.childNodes[0]);

      this.backwardLastHeaderContent = headerContent;
    }
  },

  /**
   * Adds an item to the last group
   * The caller is in charge of inserting the last group into the DOM
   */
  addForwardItem: function(item) {
    this.addForwardHeader(item);

    var newItem = this.itemNode(item);
    this.dom.forwardLastGroup.appendChild(newItem);
  },

  /**
   * Adds an item to the last group
   * The caller is in charge of inserting the last group into the DOM
   */
  addBackwardItem: function(item, isLast) {
    var newItem = this.itemNode(item);

    var parent = this.dom.backwardLastGroup;
    parent.insertBefore(newItem, parent.childNodes[0]);

    this.addBackwardHeader(item, isLast);
  },

  /**
   * Renders a block of items
   * @param {Integer} index of block to render.
   */
  renderBlock: function(blocks, direction) {

    this.dom[direction + 'LastGroup'] = document.createElement('ul');

    if (direction === 'forward') {
      blocks.forEach(function eachItem(item) {
        this.addForwardItem(item, direction);
      }, this);
      this.element.appendChild(this.dom.forwardLastGroup);
    } else {
      var blockSize = blocks.length - 1;
      blocks.forEach(function eachItem(item, idx) {
        this.addBackwardItem(item, idx == blockSize);
      }, this);

      this.prependAndScroll(this.dom.backwardLastGroup);
    }
  },

  /**
   * Prepends an element and maintains the parents scroll position
   */
  prependAndScroll: function(el) {
    this.element.insertBefore(el, this.element.childNodes[0]);
    var height = el.getBoundingClientRect().height;
    setTimeout(function nextTick() {
      this.element.scrollTop += height;
    }.bind(this), 0);
  },

  /**
   * Add more items when we come within a scroll threshold.
   * This should be called anytime we scroll or
   * influence the height of the container.
   */
  checkScroll: function() {

    var scrollTop = this.element.scrollTop;

    // Fetch the next block if we are near the end
    var forwardDiff = this.element.scrollHeight - (
      scrollTop + this.elementHeight
    );

    if (forwardDiff < 300 && this.forwardCursor) {
      this.continue('forward');
      this.forwardCursor = null;
    }

    // Fetch the starting block if we are near the beginning
    if (scrollTop < 200 && this.backwardCursor) {
      this.continue('backward');
      this.backwardCursor = null;
    }
  }
};

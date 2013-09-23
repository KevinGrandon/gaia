/**
 * A class which scrolls a list by cursor
 *  and batch renders as needed.
 * @param {Object} request object.
 */
function FastScroll() {

  // Cached data
  this.blocks = {};

  this.forwardBlockCount = 0;

  // Populate the first two blocks
  this.populateBlock(this.forwardBlockCount, this.renderBlock.bind(this));
  this.populateBlock(this.forwardBlockCount + 1);

  this.elementHeight = this.element.getBoundingClientRect().height;
  this.element.addEventListener('scroll', this);
}

FastScroll.prototype = {

  // Number of blocks per batch
  blockSize: 20,

  // When we scroll within this many pixels, fetch more data
  scrollThreshold: 500,

  // How often we reclaim dom elements after scroll idle
  reclaimTime: 500,

  populateBlock: function(blockIdx, callback) {
    debug("MAKING BLOCK", blockIdx)
    var config = {};
    var request = new this.factory(config);

    var self = this;
    var group = [];

    request.onsuccess = function cursorSuccess(event) {
      var cursor = event.target.result;

      if (cursor && cursor.value) {
        group.push(cursor.value);

        if (group.length === self.blockSize) {
          next();
        } else {
          cursor.continue();
        }
      } else {
        next();
      }
    };

    function next() {
      self.blocks[blockIdx] = group;
      if (callback) {
        callback(group);
      }
    }
  },

  renderBlock: function(group) {
    group.forEach(this.addItem, this);
  },

  addItem: function(item) {

    var newEl = document.createElement('div');
    newEl.className = 'list-item';
    newEl.innerHTML = '<p>' + JSON.stringify(item) + '</p>';

    this.element.appendChild(newEl);
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

  handleEvent: function(e) {
    if (e.type === 'scroll') {
      this.checkScroll();
    }
  },

  /**
   * Reclaims dom nodes which have been scrolled off screen.
   * Updates object properties and offsets so we can create new cursors.
   * Reclaims elements within 2x of scroll threshold.
   */
  reclaim: function() {
    var removeEls = [];
    var scrollAdjust = 0;

    for (var i = 0, iLen = this.element.children.length; i < iLen; i++) {
      var el = this.element.children[i];
      var rect = el.getBoundingClientRect();

      if (rect.top < 0 - this.scrollThreshold * 2) {
        scrollAdjust += rect.height;
        removeEls.push(el);
      } else {
        break;
      }
    }

    var newScrollTop = this.element.scrollTop - scrollAdjust;

    removeEls.forEach(function eachEl(el) {
      el.parentNode.removeChild(el);
    });

    if (scrollAdjust) {
      this.element.scrollTop = newScrollTop;
    }
  },

  /**
   * Add more items when we come within a scroll threshold.
   * This should be called anytime we scroll or
   * influence the height of the container.
   */
  checkScroll: function() {

    // Clear the element reclaimer if we have one
    if (this.reclaimTimeout) {
      clearTimeout(this.reclaimTimeout);
    }

    var scrollTop = this.element.scrollTop;

    // Fetch the next block if we are near the end
    var forwardDiff = this.element.scrollHeight - (
      scrollTop + this.elementHeight
    );

    if (forwardDiff < this.scrollThreshold && !this.isForwardFetching) {

      this.isForwardFetching = true;

      // Immediately render the next block which should be cached
      this.forwardBlockCount++;
      this.renderBlock(this.blocks[this.forwardBlockCount]);

      // Make a call to get the next forward block
      this.populateBlock(this.forwardBlockCount+1, function() {
        this.isForwardFetching = false;
      }.bind(this));
    }

    this.reclaimTimeout = setTimeout(this.reclaim.bind(this), this.reclaimTime);
  }
};

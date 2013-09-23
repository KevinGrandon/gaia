var forwardConfig = {
  sortBy: 'normalized',
  sortOrder: 'ascending'
};

var backwardConfig = {
  sortBy: 'normalized',
  sortOrder: 'descending'
};

/**
 * Generates a cursor which returns 20 results
 */
function TempCursor() {

debug('New cursor.')

  var pending = 20;
  var offset = 0;
  var current = 0;

  var self = this;

  function nextTick() {
    if (current <= pending + offset) {

      current++;

      var event = {
        target: {
          result: {
            advance: function(count) {
              debug('Cursor advance called.', count)
              current += count;
              pending += count;
              setTimeout(nextTick, 0);
            },

            continue: function() {
              setTimeout(nextTick, 0);
            },

            value: {
              name: current
            }
          }
        }
      };

      self.onsuccess(event);
    }
  }

  setTimeout(nextTick, 0);
}

TempCursor.prototype = {
};








function MyScroll(request) {
  FastScroll.apply(this, arguments);
}

MyScroll.prototype = {
  __proto__: FastScroll.prototype,

  factory: TempCursor,

  element: document.getElementById('fastscroll')
};

var scroller = new MyScroll();




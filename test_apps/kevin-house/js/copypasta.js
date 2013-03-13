(function initCopyPaste(){

  /**
   * Copy/Paste base class
   */
  function CopyPaste() {
    this.INTERACT_DELAY = 700;
    this.TOUCH_BOUND = 50;

    this.controlsShown = false;

    this.init();
  }

  CopyPaste.prototype = {
    init: function() {
      window.addEventListener(this.START, this.onStart.bind(this));
      window.addEventListener(this.MOVE, this.onMove.bind(this));
      window.addEventListener(this.END, this.onEnd.bind(this));
    },

    onStart: function(e) {
      dump('GOT TOUCH START' + e)

      if (this.controlsShown) {
        this.teardown();
        return;
      }

      this.startE = e;
      this.startXY = this.coords(e);

      this.interactTimeout = setTimeout(
        this.showControls.bind(this),
        this.INTERACT_DELAY
      );
    },

    onMove: function(e) {
      var xy = this.coords(e);

      if ( !this.controlsShown && (
          Math.abs(this.startXY.x - xy.x) > this.TOUCH_BOUND ||
          Math.abs(this.startXY.y - xy.y) > this.TOUCH_BOUND) ) {
        clearTimeout(this.interactTimeout);
        this.controlsShown = false;
      }

      //dump('Got move!' + xy.x + ' - ' + xy.y)
      //dump('Got move!')
    },

    onEnd: function(e) {
      if (this.controlsShown) {
        return;
      }

      this.controlsShown = false;
      clearTimeout(this.interactTimeout);
    },

    showControls: function() {
      this.controlsShown = true;

      var target = this.startE.target;
      window.getSelection().selectAllChildren(target);

      // Get the region of the selection
      var targetArea = target.getBoundingClientRect();
      var leftKnobPos = {
        top: targetArea.top + window.pageYOffset,
        left: targetArea.left + window.pageXOffset
      };

      var rightKnobPos = this.getSelectionPosition();

      this.createKnob('left', leftKnobPos);
      this.createKnob('right', rightKnobPos);
    },

    /**
     * Removes the Copy/Paste UI
     */
    teardown: function() {
      if (this.leftKnob) {
        document.body.removeChild(this.leftKnob);
        delete this.leftKnob;
      }
      if (this.rightKnob) {
        document.body.removeChild(this.rightKnob);
        delete this.rightKnob;
      }
      this.controlsShown = false;
    },

    /**
     * Gets coordinates of selected text
     * This returns the end of the selection
     */
    getSelectionPosition: function() {
      var range = window.getSelection().getRangeAt(0).cloneRange();
      range.collapse(false);
      var dummy = document.createElement("span");
      range.insertNode(dummy);

      var rect = dummy.getBoundingClientRect();
      var coords = {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset
      };
      dummy.parentNode.removeChild(dummy);

      return coords;
    },

    /**
     * Creates a left or right knob
     */
    createKnob: function(name, pos) {
      var knob = name + 'Knob'
      if (this[knob]) {
        this[knob].parentNode.removeChild(this[knob]);
      }

      this[knob] = document.createElement('div');
      this[knob].className = 'knob ' + name;
      document.body.appendChild(this[knob]);

      this[knob].style.left = pos.left + 'px';
      this[knob].style.top = pos.top + 'px';

      this[knob].addEventListener(this.START, function(origEvt) {

        origEvt.stopImmediatePropagation();
        origEvt.preventDefault();

        var mover = this.getKnobMover(this[knob]);
        window.addEventListener(this.MOVE, mover);
        window.addEventListener(this.END, function() {
          window.removeEventListener(this.MOVE, mover);
        }.bind(this));
      }.bind(this));
    },

    /**
     * Logic to expand/collapse the selection
     * when the right knob is moved.
     */
    rightKnobHandler: function(xy, el) {
      var modification = 'word';
      var direction;

      if (xy.x > parseInt(el.style.left, 10) ||
          xy.y > parseInt(el.style.top, 10)) {
        direction = 'right';
      } else {
        direction = 'left';
      }

      var lastPosition = {};
      while (true) {

        var thisPosition = this.getSelectionPosition();

        // Break if we meet the word, or did not move on this iteration
        if (thisPosition.top == lastPosition.top &&
          thisPosition.left == lastPosition.left) {
          break;
        } 
        if ( direction == 'right' &&
          thisPosition.top > xy.y &&
          thisPosition.left > xy.x) {
          break;
        } else if ( direction == 'left' &&
          thisPosition.top < xy.y &&
          thisPosition.left < xy.x) {
          break;
        }

        var selection = window.getSelection();
        selection.modify('extend', direction, modification);

        lastPosition = thisPosition;
      }
    },

    /**
     * Logic to expand/collapse the selection
     * when the left knob is moved.
     */
    leftKnobHandler: function(xy, el) {
      var direction;

      function getRangePosition() {
        var range = window.getSelection().getRangeAt(0);
        var rects = range.getClientRects();

        var topmost;
        for (var i = 0, rect; rect = rects[i]; i++) {
          if (!topmost || rect.top < topmost.top) {
            topmost = rect;
          }
        }

        var rangePosition = {
          x: topmost.left + window.pageXOffset,
          y: topmost.top + window.pageYOffset
        };

        return rangePosition;
      }

      var thisPosition = getRangePosition();

      if (xy.y < thisPosition.y ||
          xy.x < thisPosition.x) {
        direction = 'left';
      } else {
        direction = 'right';
      }

      var lastPosition = {};
      var modified = false;

      while (true) {

        thisPosition = getRangePosition();

        // Break if we meet the word, or did not move on this iteration
        if ( direction == 'right' && (
          thisPosition.y > xy.y &&
          thisPosition.x > xy.x) ) {
          break;
        } else if ( direction == 'left' &&
          thisPosition.y < xy.y &&
          thisPosition.x < xy.x) {
          break;
        }

        var range = window.getSelection().getRangeAt(0);
        var previous;
        var offset = 0;

        if (direction == 'left') {
            // Detect if selection is backwards
            var sel = window.getSelection();
            var range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            var backwards = range.collapsed;
            range.detach();

            // modify() works on the focus of the selection
            var endNode = sel.focusNode, endOffset = sel.focusOffset;
            sel.collapse(sel.anchorNode, sel.anchorOffset);

            var selDirection;
            if (backwards) {
                selDirection = 'forward';
            } else {
                selDirection = 'backward';
            }

            sel.modify("move", selDirection, "word");
            sel.extend(endNode, endOffset);
        } else {
          var sel = window.getSelection();
          var range = sel.getRangeAt(0);
          try {
            range.setStart(sel.anchorNode, sel.anchorOffset+1);
          } catch(e) {
            console.log('Couldn\'t get element')
            break;
          }
        }

        lastPosition = thisPosition;
      }
    },

    /**
     * Is called when the user has tapped on a knob
     * and moves their finger around.
     */
    getKnobMover: function(el) {
      var self = this;

      return function(evt) {
        evt.stopImmediatePropagation();

        var xy = self.coords(evt);

        if (el.classList.contains('right')) {
          self.rightKnobHandler(xy, el);
        } else {
          self.leftKnobHandler(xy, el);
        }

        el.style.left = xy.x + 'px';
        el.style.top = xy.y + 'px';
      }
    }
  };

  function MouseCopyPaste() {
    this.START = 'mousedown';
    this.MOVE = 'mousemove';
    this.END = 'mouseup';
    CopyPaste.apply(this);
  }

  MouseCopyPaste.prototype = {
    __proto__: CopyPaste.prototype,

    /**
     * Extracts the X/Y positions for a touch event
     */
    coords: function(e) {
      return {
        x: e.pageX,
        y: e.pageY,
      };
    }
  };

  function TouchCopyPaste() {
    this.START = 'touchstart';
    this.MOVE = 'touchmove';
    this.END = 'touchend';
    CopyPaste.apply(this);
  }

  TouchCopyPaste.prototype = {
    __proto__: CopyPaste.prototype,

    /**
     * Extracts the X/Y positions for a touch event
     */
    coords: function(e) {
      var touch = e.originalEvent.touches[0];

      return {
        x: touch.pageX,
        y: touch.pageY
      };
    }
  };

  if ("ontouchstart" in window) {
    var copyPaste = new TouchCopyPaste();
  } else {
    var copyPaste = new MouseCopyPaste();
  }
}());
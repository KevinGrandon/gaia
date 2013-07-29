/*
 * Icon constructor
 *
 * @param {Object} descriptor
 *                 An object that contains the data necessary to draw this
 *                 icon.
 * @param {Application} app [optional]
 *                      The Application or Bookmark object corresponding to
 *                      this icon.
 */
function AppIcon(descriptor, app) {
  Icon.apply(this, arguments);
  this.app = app;
  this.updateAppStatus(app);
}

AppIcon.prototype = {

  __proto__: Icon.prototype,

  // It defines the time (in ms) to ensure that the onDragStop method finishes
  FALLBACK_DRAG_STOP_DELAY: 1000, 

  DEFAULT_BOOKMARK_ICON_URL: window.location.protocol + '//' +
                    window.location.host + '/style/images/default_favicon.png',
  DEFAULT_ICON_URL: window.location.protocol + '//' + window.location.host +
                    '/style/images/default.png',
  DOWNLOAD_ICON_URL: window.location.protocol + '//' + window.location.host +
                    '/style/images/app_downloading.png',
  CANCELED_ICON_URL: window.location.protocol + '//' + window.location.host +
                    '/style/images/app_paused.png',

  // These properties will be copied from the descriptor onto the icon's HTML
  // element dataset and allow us to uniquely look up the Icon object from
  // the HTML element.
  _descriptorIdentifiers: ['manifestURL', 'entry_point', 'bookmarkURL',
                           'useAsyncPanZoom'],

  /**
   * The Application (or Bookmark) object corresponding to this icon.
   */
  app: null,

  /**
   * It returns an unique identifier among all icons installed on the homescreen
   */
  getUID: function icon_getUID() {
    var descriptor = this.descriptor;

    return (descriptor.manifestURL || descriptor.bookmarkURL) +
           (descriptor.entry_point ? descriptor.entry_point : '');
  },

  isOfflineReady: function icon_isOfflineReady() {
    return !(this.descriptor.isHosted &&
      !this.descriptor.hasOfflineCache ||
      this.descriptor.isBookmark);
  },

  appendOptions: function icon_appendOptions() {
    var options = this.container.querySelector('.options');
    if (options) {
      return;
    }

    // Menu button to delete the app
    options = document.createElement('span');
    options.className = 'options';
    options.dataset.isIcon = true;
    this.container.appendChild(options);
  },

  removeOptions: function icon_removeOptions() {
    var options = this.container.querySelector('.options');
    if (!options) {
      return;
    }

    this.container.removeChild(options);
  },

  fetchImageData: function icon_fetchImageData() {
    var descriptor = this.descriptor;
    var icon = descriptor.icon;
    if (!icon) {
      this.loadCachedIcon();
      return;
    }

    // Display the default/oldRendered icon before trying to get the icon.
    // Sometimes when the network is quite bad the XHR can take time, and we
    // have an empty space
    this.loadCachedIcon();

    IconRetriever.get({
      icon: this,
      success: function(blob) {
        this.loadImageData(blob);
      },
      error: function() {
        if (this.icon && !this.downloading &&
            this.icon.classList.contains('loading')) {
          this.icon.classList.remove('loading');
          this.img.src = null;
        }
        this.loadCachedIcon();
      }
    });
  },

  loadCachedIcon: function icon_loadCachedImage() {
    var oldRenderedIcon = this.descriptor.oldRenderedIcon;
    if (oldRenderedIcon && oldRenderedIcon instanceof Blob) {
      this.renderBlob(oldRenderedIcon);
    } else {
      this.loadDefaultIcon();
    }
  },

  loadImageData: function icon_loadImageData(blob) {
    var self = this;
    var img = new Image();
    img.src = window.URL.createObjectURL(blob);

    if (this.icon && !this.downloading) {
      this.icon.classList.remove('loading');
    }

    img.onload = function icon_loadSuccess() {
      img.onload = img.onerror = null;
      window.URL.revokeObjectURL(img.src);
      self.renderImage(img);
    };

    img.onerror = function icon_loadError() {
      console.error('error while loading the icon', img.src, '. Falling back ' +
          'to default icon.');
      window.URL.revokeObjectURL(img.src);
      self.loadDefaultIcon(img);
    };
  },

  loadDefaultIcon: function icon_loadDefaultIcon(img) {
    var image = img || new Image();
    var self = this;

    if (self.img && self.img.src) {
      // If there is one already loaded, do not continue...
      image.onload = image.onerror = null;
      return;
    }

    var blob = GridManager.getBlobByDefault(self.app);
    if (blob === null) {
      // At this point theoretically the flow shouldn't go because the icons
      // by default have to be loaded, but just in case to avoid race conditions
      image.src = getDefaultIcon(self.app);
      image.onload = function icon_defaultIconLoadSucess() {
        image.onload = image.onerror = null;
        self.renderImage(image);
      };
    } else {
      self.renderBlob(blob);
      image.onload = image.onerror = null;
    }
  },

  renderImageForBookMark: function icon_renderImageForBookmark(img) {
    var self = this;
    var canvas = document.createElement('canvas');
    canvas.width = (MAX_ICON_SIZE + ICON_PADDING_IN_CANVAS) * SCALE_RATIO;
    canvas.height = (MAX_ICON_SIZE + ICON_PADDING_IN_CANVAS) * SCALE_RATIO;
    var ctx = canvas.getContext('2d');

    // Draw the background
    var background = new Image();
    background.src = 'style/images/default_background.png';
    background.onload = function icon_loadBackgroundSuccess() {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(background, 2 * SCALE_RATIO, 2 * SCALE_RATIO,
                    MAX_ICON_SIZE * SCALE_RATIO, MAX_ICON_SIZE * SCALE_RATIO);
      // Disable smoothing on icon resize
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.mozImageSmoothingEnabled = false;
      ctx.drawImage(img, 16 * SCALE_RATIO, 16 * SCALE_RATIO,
                    32 * SCALE_RATIO, 32 * SCALE_RATIO);
      canvas.toBlob(self.renderBlob.bind(self));
    };
  },

  renderImage: function icon_renderImage(img) {
    if (this.app && this.app.iconable) {
      this.renderImageForBookMark(img);
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = (MAX_ICON_SIZE + ICON_PADDING_IN_CANVAS) * SCALE_RATIO;
    canvas.height = (MAX_ICON_SIZE + ICON_PADDING_IN_CANVAS) * SCALE_RATIO;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 2;

    // Deal with very small or very large icons
    img.width =
        Math.min(MAX_ICON_SIZE, Math.max(img.width, MAX_ICON_SIZE));
    img.height =
        Math.min(MAX_ICON_SIZE, Math.max(img.height, MAX_ICON_SIZE));

    var width = Math.min(img.width * SCALE_RATIO,
                         canvas.width - ICON_PADDING_IN_CANVAS * SCALE_RATIO);
    var height = Math.min(img.width * SCALE_RATIO,
                          canvas.height - ICON_PADDING_IN_CANVAS * SCALE_RATIO);
    ctx.drawImage(img,
                  (canvas.width - width) / 2,
                  (canvas.height - height) / 2,
                  width, height);
    ctx.fill();

    canvas.toBlob(this.renderBlob.bind(this));
  },

  // The url that is passed as a parameter to the callback must be revoked
  loadRenderedIcon: function icon_loadRenderedIcon(callback) {
    var img = this.img;
    img.src = window.URL.createObjectURL(this.descriptor.renderedIcon);
    if (callback) {
      img.onload = img.onerror = function done() {
        callback(this.src);
        img.onload = img.onerror = null;
      };
    }
  },

  renderBlob: function icon_renderBlob(blob) {
    this.descriptor.renderedIcon = blob;
    GridManager.markDirtyState();
    this.displayRenderedIcon();
  },

  displayRenderedIcon: function icon_displayRenderedIcon() {
    var self = this;
    this.loadRenderedIcon(function cleanup(url) {
      self.img.style.visibility = 'visible';
      window.URL.revokeObjectURL(url);
      if (self.needsShow)
        self.show();
    });
  },

  show: function icon_show() {
    // Wait for the icon image to load until we start the animation.
    if (!this.img.naturalWidth) {
      this.needsShow = true;
      return;
    }

    this.needsShow = false;
    var container = this.container;
    container.dataset.visible = true;
    container.addEventListener('animationend', function animationEnd(e) {
      container.removeEventListener('animationend', animationEnd);
      delete container.dataset.visible;
    });
  },

  updateAppStatus: function icon_updateAppStatus(app) {
    if (app) {
      this.downloading = app.downloading;
      this.cancelled = (app.installState === 'pending') && !app.downloading;
    } else {
      this.downloading = false;
      this.cancelled = false;
    }
  },

  update: function icon_update(descriptor, app) {
    this.app = app;
    this.updateAppStatus(app);
    var oldDescriptor = this.descriptor;
    this.descriptor = descriptor;
    descriptor.removable === true ? this.appendOptions() : this.removeOptions();

    // Update offline availability
    this.container.dataset.offlineReady = this.isOfflineReady();

    if (descriptor.updateTime == oldDescriptor.updateTime &&
        descriptor.icon == oldDescriptor.icon) {
      this.descriptor.renderedIcon = oldDescriptor.renderedIcon;
    } else {
      this.descriptor.oldRenderedIcon = oldDescriptor.renderedIcon;
      this.fetchImageData();
    }
    if (descriptor.updateTime != oldDescriptor.updateTime ||
        descriptor.name != oldDescriptor.name ||
        descriptor.localizedName != oldDescriptor.localizedName) {
      this.translate();
    }
  },

  showDownloading: function icon_showDownloading() {
    this.img.src = this.DOWNLOAD_ICON_URL;
    this.container.style.visibility = 'visible';
    this.icon.classList.add('loading');
  },

  showCancelled: function icon_showCancelled() {
    this.img.src = this.CANCELED_ICON_URL;
    this.container.style.visibility = 'visible';
    this.icon.classList.remove('loading');
    this.fetchImageData();
  },

  remove: function icon_remove() {
    this.container.parentNode.removeChild(this.container);
  },

  /*
   * Translates the label of the icon
   */
  translate: function icon_translate() {
    var descriptor = this.descriptor;
    if (descriptor.bookmarkURL)
      return;

    var app = this.app;
    if (!app)
      return;

    var manifest = app.manifest || app.updateManifest;
    if (!manifest)
      return;

    var iconsAndNameHolder = manifest;
    var entryPoint = descriptor.entry_point;
    if (entryPoint)
      iconsAndNameHolder = manifest.entry_points[entryPoint];

    var localizedName = new ManifestHelper(iconsAndNameHolder).name;

    this.label.textContent = localizedName;
    if (descriptor.localizedName != localizedName) {
      descriptor.localizedName = localizedName;
      GridManager.markDirtyState();
    }

    this.applyOverflowTextMask();
  },

  /*
   * This method is invoked when the drag gesture starts
   *
   * @param{int} x-coordinate
   *
   * @param{int} y-coordinate
   */
  onDragStart: function icon_onDragStart(x, y) {
    this.initX = x;
    this.initY = y;

    var draggableElem = this.draggableElem = document.createElement('div');
    draggableElem.className = 'draggable';

    // For some reason, cloning and moving a node re-triggers the blob
    // URI to be validated. So we assign a new blob URI to the image
    // and don't revoke it until we're finished with the animation.
    this.loadRenderedIcon();

    var icon = this.icon.cloneNode();
    var img = icon.querySelector('img');
    img.style.visibility = 'hidden';
    img.onload = img.onerror = function unhide() {
      img.style.visibility = 'visible';
    };
    draggableElem.appendChild(icon);

    var container = this.container;
    container.dataset.dragging = 'true';

    var rectangle = container.getBoundingClientRect();
    var style = draggableElem.style;
    style.left = rectangle.left + 'px';
    style.top = rectangle.top + 'px';
    this.initXCenter = (rectangle.left + rectangle.right) / 2;
    this.initYCenter = (rectangle.top + rectangle.bottom) / 2;
    this.initHeight = rectangle.bottom - rectangle.top;

    document.body.appendChild(draggableElem);
  },

  addClassToDragElement: function icon_addStyleToDragElement(className) {
    this.draggableElem.classList.add(className);
  },

  removeClassToDragElement: function icon_addStyleToDragElement(className) {
    this.draggableElem.classList.remove(className);
  },

  /*
   * This method is invoked when the drag gesture finishes
   */
  onDragStop: function icon_onDragStop(callback) {
    var container = this.container;

    var rect = container.getBoundingClientRect();
    var x = (Math.abs(rect.left + rect.right) / 2) % window.innerWidth;
    x -= this.initXCenter;

    var y = (rect.top + rect.bottom) / 2 +
            (this.initHeight - (rect.bottom - rect.top)) / 2;
    y -= this.initYCenter;

    var draggableElem = this.draggableElem;
    var style = draggableElem.style;
    style.MozTransition = '-moz-transform .4s';
    style.MozTransform = 'translate(' + x + 'px,' + y + 'px)';

    var finishDrag = function() {
      delete container.dataset.dragging;
      if (draggableElem) {
        var img = draggableElem.querySelector('img');
        window.URL.revokeObjectURL(img.src);
        draggableElem.parentNode.removeChild(draggableElem);
      }
      callback();
    };

    // We ensure that there is not an icon lost on the grid
    var fallbackID = window.setTimeout(function() {
      fallbackID = null;
      finishDrag();
    }, this.FALLBACK_DRAG_STOP_DELAY);

    var content = draggableElem.querySelector('div');
    content.style.MozTransform = 'scale(1)';
    content.addEventListener('transitionend', function tEnd(e) {
      e.target.removeEventListener('transitionend', tEnd);
      if (fallbackID !== null) {
        window.clearTimeout(fallbackID);
        finishDrag();
      }
    });
  },

  getTop: function icon_getTop() {
    return this.container.getBoundingClientRect().top;
  },

  getLeft: function icon_getLeft() {
    return this.container.getBoundingClientRect().left;
  },

  getWidth: function icon_getWidth() {
    return this.container.getBoundingClientRect().width;
  }
};

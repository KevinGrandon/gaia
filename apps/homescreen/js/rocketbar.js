var Rocketbar = {
  nodeNames: [
    'activation-icon',
    'overlay',
    'input',
    'results'
  ],

  DOM: {},
  installedApps: {},

  init: function() {
    this.getInstalledApps();

    this.nodeNames.forEach(function(name) {
      this.DOM[this.toCamelCase(name)] =
        document.getElementById('rocketbar-' + name);
    }, this);

    this.DOM.activationIcon.addEventListener('click',
      this.show.bind(this, true)
    );
    this.DOM.overlay.addEventListener('click', this.handleClick.bind(this));
    this.DOM.input.addEventListener('click', this.inputFocus);
    this.DOM.input.addEventListener('keyup', this.inputKeyUp.bind(this));
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
  },

  getInstalledApps: function() {
    var self = this;
    navigator.mozApps.mgmt.getAll().onsuccess = function(evt) {
      var apps = evt.target.result;
      apps.forEach(function(app) {
        self.installedApps[app.manifestURL] = app;
      });
    };
  },

  toCamelCase: function(str) {
     return str.replace(/\-(.)/g, function replacer(str, p1) {
       return p1.toUpperCase();
     });
  },

  handleClick: function(evt) {
    var target = evt.target;
    var manifestURL = target.getAttribute('data-manifest-url');
    var entryPoint = target.getAttribute('data-entry-point');

    if (manifestURL && this.installedApps[manifestURL]) {
       this.installedApps[manifestURL].launch(entryPoint);
    }
    this.hide();
  },

  handleHashChange: function(evt) {
    if (document.location.hash === '#root') {
      this.hide();
    }
  },

  inputFocus: function(evt) {
    evt.stopPropagation();
  },

  inputKeyUp: function(evt) {
    var results = [];

    // Clean up the query and display blank results if blank
    var query = this.DOM.input.value.toLowerCase().trim();
    if (query.length == 0) {
      this.showAppResults(results);
      return;
    }

    // Create a list of manifestURLs for apps with names which match the query
    var manifestURLs = Object.keys(this.installedApps);
    manifestURLs.forEach(function(manifestURL) {

      if (this.HIDDEN_APPS.indexOf(manifestURL) !== -1)
        return;

      var app = this.installedApps[manifestURL];
      var manifest = app.manifest;

      var appListing = [];

      if (manifest.entry_points) {
        for (var i in manifest.entry_points) {
          manifest.entry_points[i].entryPoint = i;
          appListing.push(manifest.entry_points[i]);
        }
      }
      appListing.push(manifest);

      appListing.forEach(function(manifest) {
        if (manifest.name.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push({
            manifestURL: manifestURL,
            app: app,
            manifest: manifest,
            entryPoint: manifest.entryPoint
          });
        }
      });
    }, this);
    this.showAppResults(results);
  },

  showAppResults: function(results) {
    this.DOM.results.innerHTML = '';
    if (results.length == 0)
      return;
    results.forEach(function(result) {
      var app = result.app;
      var li = document.createElement('li');
      li.textContent = result.manifest.name;
      li.setAttribute('data-manifest-url', result.manifestURL);

      if (result.entryPoint) {
        li.setAttribute('data-entry-point', result.entryPoint);
      }

      if (result.manifest.icons) {
        li.style.backgroundImage = 'url(' + app.origin +
          result.manifest.icons['60'] + ')';
      }
      this.DOM.results.appendChild(li);
    }, this);
  },

  show: function(focus) {
    this.DOM.overlay.classList.add('active');
    if (focus) {
      this.DOM.input.focus();
    }
    document.location.hash = '';
  },

  hide: function() {
    this.DOM.input.blur();
    setTimeout(function() {
      this.DOM.overlay.classList.remove('active');
      this.DOM.input.value = '';
      this.showAppResults([]);
    }.bind(this), 200);
  },

  HIDDEN_APPS: ['keyboard.gaiamobile.org/manifest.webapp',
      'wallpaper.gaiamobile.org/manifest.webapp',
      'bluetooth.gaiamobile.org/manifest.webapp',
      'pdfjs.gaiamobile.org/manifest.webapp',
      'homescreen.gaiamobile.org/manifest.webapp',
      'system.gaiamobile.org/manifest.webapp',
      'image-uploader.gaiamobile.org/manifest.webapp'
  ]
};

Rocketbar.init();

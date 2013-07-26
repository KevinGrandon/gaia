var Rocketbar = {
  nodeNames: [
    'activation-icon',
    'overlay',
    'input',
    'search-results'
  ],

  DOM: {},
  installedApps: {},

  plugins: null,

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
    this.DOM.searchResults.addEventListener('scroll', this.blur.bind(this));
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
  },

  blur: function(e) {
    this.DOM.input.blur();
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
       this.hide();
    }

    if (target.dataset.siteUrl) {
      new MozActivity({ name: 'view',
        data: { type: 'url', url: target.dataset.siteUrl }
      });
    }
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

    this.DOM.searchResults.innerHTML = '';

    // If the user is typing quickly, we may request multiple async results
    // This function verifies that the current query matches the desired query
    this.lastQuery = query;
    var verifyQuery = (function(callback) {
      return function() {
        if (this.lastQuery === query) {
          callback.apply(this, arguments);
        }
      }.bind(this);
    }).bind(this);

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

    for (var name in this.plugins) {
      var plugin = this.plugins[name];
      var LIMIT = 12;
      OpenSearchPlugins.getSuggestions(name, query, LIMIT,
        (function(_name, _plugin) {
          return verifyQuery(function(results) {
            if (_name == 'EverythingMe' || _name == 'Marketplace') {
              this.visualSearchResults(results, _plugin);
            } else {
              this.showSearchResults(results, _plugin);
            }
          });
        })(name, plugin)
      );
    }
  },

  showAppResults: function(results) {
    if (results.length === 0)
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
      this.DOM.searchResults.appendChild(li);
    }, this);
  },

  showSearchResults: function(results, plugin) {
    var resultItem = document.createElement('li');
    var resultTitle = document.createElement('h3');
    resultTitle.textContent = 'Search ' + plugin.shortname + ' for:';
    resultItem.appendChild(resultTitle);
    resultItem.style.backgroundImage = 'url(' + plugin.icon + ')';

    // Render individual results within the element
    results.forEach(function(result) {

      if (!result.title || !result.uri) {
        return;
      }

      var resultURL = document.createElement('small');
      resultURL.className = 'suggestion';
      resultURL.textContent = result.title;
      resultURL.setAttribute('data-site-url', result.uri);
      resultItem.appendChild(resultURL);
    }, this);
    this.DOM.searchResults.appendChild(resultItem);
  },

  visualSearchResults: function(results, plugin) {
    var resultItem = document.createElement('li');
    resultItem.className = 'visual';
    var resultTitle = document.createElement('h3');
    resultTitle.textContent = plugin.shortname + ' Results';
    resultItem.appendChild(resultTitle);

    // Render individual results within the element
    results.forEach(function(result) {

      if (!result.title || !result.uri) {
        return;
      }

      var resultURL = document.createElement('small');
      resultURL.className = 'suggestion';
      resultURL.innerHTML =
        '<img height="48" width="48" src="' + result.icon + '">' +
        result.title;
      resultURL.setAttribute('data-site-url', result.uri);
      resultItem.appendChild(resultURL);
    }, this);

    this.DOM.searchResults.appendChild(resultItem);
  },

  show: function(focus) {

    // Reset plugins everytime we show
    OpenSearchPlugins.init(function() {
      this.plugins = OpenSearchPlugins.plugins;
    }.bind(this));

    this.DOM.overlay.classList.add('visible');
    if (focus) {
      this.DOM.input.focus();
    }
    document.location.hash = '';
  },

  hide: function() {
    this.DOM.input.blur();
    setTimeout(function() {
      this.DOM.overlay.classList.remove('visible');
      this.DOM.input.value = '';
      this.DOM.searchResults.innerHTML = '';
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

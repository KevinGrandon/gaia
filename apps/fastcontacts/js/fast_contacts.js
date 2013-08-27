(function() {
  // Get the db ready!
  var _db = null;
  var idb = window.indexedDB;

  debug('Opening DB.');
  var req = idb.open(DB_NAME, DB_VERSION);

  req.onsuccess = function(event) {
    debug('DB onsuccess.');
    _db = event.target.result;
    dispatchEvent(new CustomEvent('fast-contacts-init-db'));
  };

  req.onblocked = function(error) {
    debug('Request blocked.');
  };

  req.onupgradeneeded = function(event) {
    debug('Database needs upgrade:', event.oldVersion, event.newVersion);

    var db = event.target.result;

    // Reset the store
    try {
      db.deleteObjectStore(DB_STORE_CONTACTS);
    } catch (e) {}

    var objectStore = db.createObjectStore(DB_STORE_CONTACTS, {keyPath: 'id'});
    var indexes = [
      ['familyName', 'properties.familyName'],
      ['givenName', 'properties.givenName'],
      ['category', 'properties.category'],
      ['normalized', 'properties.normalized'],
      ['tel', 'search.tel'],
      ['email', 'search.email']
    ];
    indexes.forEach(function(tuple) {
      objectStore.createIndex(tuple[0], tuple[1], { multiEntry: true });
    });
  };

  req.onerror = function(error) {
    debug('Request error.', error);
  };

  function ContactRequest(config) {
    this.config = config;
    this.init();
  }

  ContactRequest.prototype = {
    init: function() {
      if (!_db) {
        debug('Waiting for db to init.');
        window.addEventListener('fast-contacts-init-db', this.init.bind(this));
        return;
      }

      debug('Database init finished.');

      setTimeout(function nextTick() {
        debug('Success is:', this);
        var store = _db.transaction([DB_STORE_CONTACTS], 'readwrite')
          .objectStore(DB_STORE_CONTACTS);

        var index = store.index('givenName');
        var keyRange;

        if (this.config.filterOp == 'upperBound') {
          keyRange = IDBKeyRange.upperBound(this.config.filterValue, true);
        } else if (this.config.filterOp == 'lowerBound') {
          keyRange = IDBKeyRange.lowerBound(this.config.filterValue);
        }

        index.openCursor(keyRange).onsuccess = this.onsuccess;
      }.bind(this), 0);
    },
    onsuccess: null,
    onerror: null
  };

  navigator.fastContacts = {
    find: function(config) {
      debug('Calling find:', JSON.stringify(config));
      return new ContactRequest(config);
    }
  };
}());

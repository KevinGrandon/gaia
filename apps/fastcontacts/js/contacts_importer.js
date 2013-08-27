(function() {

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

window.ContactsImporter = {

  /**
   * Called when we need to make an import from mozContacts
   * Iterates through all contacts, saves to localStorage,
   * then refreshes page to import.
   * The reason being is that we can not access two datastores at once.
   */
  stream: function(event, callback) {
    // expose the global db object
    var db = event.target.result;

    var counter = 0;

    var streamReq = navigator.mozContacts.getAll({});
    var allContacts = [];

    streamReq.onsuccess = (function(event) {
      var cursor = event.target;
      var result = cursor.result;
      if (result) {
        counter++;
        //debug('Processing: ', counter, JSON.stringify(result));
        allContacts.push(result);
        cursor.continue();
      } else {
        setTimeout(function() {
          delete streamReq;
          setTimeout(function() {
            gotAllContacts.call(this);
          }.bind(this), 0);
        }.bind(this), 0);
      }
    }).bind(this);

    function gotAllContacts() {

      var jsonContacts = [];

      allContacts.forEach(function(contact) {
        contact = this.makeImport({
          properties: contact
        });

        jsonContacts.push(contact);
      }, this);

      localStorage.setItem('IMPORT_CACHE', JSON.stringify(jsonContacts));
      window.location = window.location.protocol +
        '//' + window.location.host + '/from_cache.html';
    }
  },

  saveContact: function(db, aContact, successCb) {
    //debug('Starting save transaction for:', DB_STORE_CONTACTS);

    //debug('SAVING:', JSON.stringify(aContact))

    var store = db.transaction([DB_STORE_CONTACTS], 'readwrite')
      .objectStore(DB_STORE_CONTACTS);
    var writeReq = store.add(aContact);

    writeReq.onsuccess = successCb;

    writeReq.onerror = function(event) {
      console.log('error writing place');
    };
  },

  makeImport: function(aContact) {
    var contact = {};
    contact.properties = {
      name: [],
      normalized: [],
      honorificPrefix: [],
      givenName: [],
      additionalName: [],
      familyName: [],
      honorificSuffix: [],
      nickname: [],
      email: [],
      photo: [],
      url: [],
      category: [],
      adr: [],
      tel: [],
      org: [],
      jobTitle: [],
      bday: null,
      note: [],
      impp: [],
      anniversary: null,
      sex: null,
      genderIdentity: null,
      key: []
    };

    contact.search = {
      givenName: [],
      familyName: [],
      email: [],
      category: [],
      tel: []
    };

    for (var field in aContact.properties) {
      contact.properties[field] = aContact.properties[field];
      // Add search fields
      if (aContact.properties[field] && contact.search[field]) {
        for (var i = 0; i <= aContact.properties[field].length; i++) {
          if (aContact.properties[field][i]) {
            if ((field == 'impp' || field == 'email') &&
              aContact.properties[field][i].value) {
              var value = aContact.properties[field][i].value;
              if (value && typeof value == 'string') {
                contact.search[field].push(value.toLowerCase());
              }
            } else {
              var val = aContact.properties[field][i];
              if (typeof val == 'string') {
                contact.search[field].push(val.toLowerCase());
              }
            }
          }
        }
      }
    }

    contact.updated = aContact.updated;
    contact.published = aContact.published;
    contact.id = aContact.id;

    if (!contact.published) {
      contact.published = new Date();
    }
    contact.updated = new Date();

    if (!contact.id) {
      contact.id = guid();
    }

    // TODO: Normalize according to app
    contact.properties.normalized = [
      contact.properties.givenName,
      contact.properties.familyName,
      contact.properties.org
    ];

    //debug('Creating contact:' + JSON.stringify(contact));
    return contact;
  }
};

if (window.location.pathname === '/from_cache.html') {
  debug('Importing from cache.');
  var cachedItems = JSON.parse(localStorage.getItem('IMPORT_CACHE'));

  debug('Got items: ', cachedItems.length);

  var req = window.indexedDB.open(DB_NAME, DB_VERSION);
  var db;
  debug('Opening database:', cachedItems.length);

  req.onsuccess = function(event) {
    db = event.target.result;
    //debug('Processing item:', cachedItems.length)
    process();
  };

  function process() {
    var contact = cachedItems.shift();
    debug('Processing: ', contact);
    if (!contact) {
      localStorage.removeItem('IMPORT_CACHE');
      alert('All contacts imported. Reloading...');
      window.location = window.location.protocol +
        '//' + window.location.host + '/index.html';
      return;
    }
    ContactsImporter.saveContact(db, contact, process);
  }
} else if (window.location.pathname === '/import.html') {
  var req = window.indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = function(event) {
    debug('Starting stream:');
    ContactsImporter.stream(event, function() {
      alert('Stream complete! Reloading...');
      window.location = window.location.protocol +
        '//' + window.location.host + '/index.html';
    });
  };

}
}());

(function() {

  function App() {

    this.itemTemplate = '<li>' +
      '<a href="#">' +
        '<p>{givenName} {familyName}</p>' +
        '<p>{org}</p>' +
      '</a>' +
    '</li>';

    this._cursor = null;

    this.lastHeaderLetter = null;
    this.dom = {
      lastHeader: null,
      lastGroup: null,
      contacts: document.getElementById('contacts')
    };
  }

  App.prototype = {

    addHeader: function(item) {
      var lastLetter = item.familyName[0][0];
      if (this.lastHeaderLetter !== lastLetter) {
        console.log('Creating header:', item.familyName, lastLetter);
        this.lastHeaderLetter = lastLetter;
        this.dom.lastHeader = document.createElement('header');
        this.dom.lastHeader.innerHTML = lastLetter;
        this.dom.contacts.appendChild(this.dom.lastHeader);

        this.dom.lastGroup = document.createElement('ul');
        this.dom.contacts.appendChild(this.dom.lastGroup);
      }
    },

    addItem: function(item) {

      this.addHeader(item);

      var newItem = document.createElement('li');
      newItem.innerHTML = this.itemTemplate.
        replace('{givenName}', item.givenName[0]).
        replace('{familyName}', item.familyName[0]).
        replace('{org}', item.org[0]);

      this.dom.lastGroup.appendChild(newItem);
    },

    render: function() {

      this._cursor = navigator.mozContacts.getAll({
        sortBy: 'familyName',
        sortOrder: 'ascending'
      });

      this._cursor.onsuccess = (function(event) {
        var cursor = event.target;
        if (cursor.result) {
          this.addItem(cursor.result);
          cursor.continue();
        } else {
          console.log('No more contacts');
        }
      }).bind(this);

      this._cursor.onerror = function() {
        alert('Contacts broke');
      };
    }
  };

  window.app = new App();
  window.app.render();

}());

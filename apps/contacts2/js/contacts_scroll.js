var forwardConfig = {
  sortBy: 'familyName',
  sortOrder: 'ascending'
};

var backwardConfig = {
  sortBy: 'familyName',
  sortOrder: 'descending'
};

/**
 * Contact scroller class
 * Overrides methods specific to the contact list.
 */
function ContactScroll(request) {
  CursorScroll.apply(this, arguments);
}

ContactScroll.prototype = {
  __proto__: CursorScroll.prototype,

  element: document.getElementById('contacts'),

  headerFormat: function(item) {
    if (!item.familyName[0]) {
      return item.email[0].value;
    }
    return item.familyName[0][0];
  },

  itemFormat: function(item) {
    var content = item.givenName + ' ' + item.familyName;
    if (content == ' ') {
      content = item.email[0].value;
    }

    return '<a href="#">' +
        '<p>' + content + '</p>' +
        '<p>' + item.org + '</p>' +
      '</a>';
  }
};

var scroller = new ContactScroll(navigator.mozContacts.getAll(forwardConfig));

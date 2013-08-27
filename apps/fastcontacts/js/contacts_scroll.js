var forwardConfig = {
  sortBy: 'normalized',
  sortOrder: 'ascending'
};

var backwardConfig = {
  sortBy: 'normalized',
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
    if (!item.givenName[0] && item.email[0]) {
      return item.email;
    } else if (!item.givenName[0]) {
      return ' - ';
    }
    return item.givenName[0][0];
  },

  itemNode: function(item) {

    var content = item.givenName + ' ' + item.familyName;
    if (content == ' ' && item.email[0]) {
      content = item.email[0].value;
    } else if (content == ' ') {
      content = '(no name)';
    }

    var node = document.createElement('li');
    node.innerHTML = '<a href="#">' +
      '<p>' + content + '</p>' +
      '<p>' + item.org + '</p>' +
    '</a>';

    if (false && item.photo[0]) {

      var img = document.createElement('img');
      img.src = URL.createObjectURL(item.photo[0]);
      aside.appendChild(img);

      var aside = document.createElement('aside');
      aside.className = 'pack-end';

      node.insertBefore(aside, node.childNodes[0]);
    }

    return node;
  },

  continue: function(direction) {
    this[direction + 'Offset']++;

    var request = navigator.fastContacts.find(window[direction + 'Config']);
    this.advanceCount = this[direction + 'Offset'];
    this.setCursor(request, direction);
  }
};

var scroller = new ContactScroll(navigator.fastContacts.find(forwardConfig));

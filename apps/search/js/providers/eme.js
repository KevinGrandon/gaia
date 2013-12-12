(function() {

  'use strict';

  function Eme() {
    this.name = 'Eme';

    window.addEventListener('message', this.onmessage.bind(this));
  }

  Eme.prototype = {

    click: function(target) {
      Search.close();
      window.open(target.dataset.href);
    },

    search: function(input) {
      console.log('Searching: ', input);
      window.postMessage({ 'input': input }, window.location.origin);
    },

    onmessage: function(e) {
      console.log('Search app received Eme: ', e.data);
    }
  };

  Search.provider(new Eme());
}());

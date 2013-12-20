/**
 * Logic for the global title in the statusbar
 */
var Title = {

  statusbarTitle: document.getElementById('statusbar-title'),

  set title(val) {
    this.statusbarTitle.innerHTML = val;
  },

  /**
   * Initializes listeners to set the state
   */
  init: function() {
    window.addEventListener('appchromeloading', this);
    window.addEventListener('home', this);
    window.addEventListener('rocketbarshown', this);
    window.addEventListener('titlechange', this);
  },

  handleEvent: function(e) {

    if (!Rocketbar.enabled) {
      return;
    }

    switch (e.type) {
      case 'home':
      case 'rocketbarshown':
        this.title = '';
        break;
      case 'appchromeloading':
      case 'titlechange':
        this.title = e.detail;
        break;
      default:
        break;
    }
  }
};

Title.init();

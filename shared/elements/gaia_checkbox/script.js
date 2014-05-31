'use strict';
/* global ComponentUtils */

window.GaiaCheckbox = (function(win) {
  // Extend from the HTMLElement prototype
  var proto = Object.create(HTMLElement.prototype);

  // Allow baseurl to be overridden (used for demo page)
  var baseurl = window.GaiaCheckboxBaseurl ||
    '/shared/elements/gaia_checkbox/';

  proto.createdCallback = function() {
    var shadow = this.createShadowRoot();
    this._template = template.content.cloneNode(true);
    this._input = this._template.querySelector('input[type="checkbox"]');

    var checked = this.getAttribute('checked');
    if (checked !== null) {
      this._input.checked = true;
    }

    this._label = this._template.getElementById('checkbox-label');
    this._label.addEventListener('click', this.handleClick.bind(this));

    this.configureClass();

    shadow.appendChild(this._template);

    ComponentUtils.style.call(this, baseurl);
  };

  proto.handleClick = function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.checked = !this.checked;
    var event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  };

  /**
   * Configures the class for the element.
   */
  proto.configureClass = function() {
    this._label.className = this.className + ' pack-checkbox';
  };

  /**
   * Proxy the checked property to the input element.
   */
  Object.defineProperty( proto, 'checked', {
    get: function() {
      return this._input.checked || false;
    },
    set: function(value) {
      this._input.checked = value;
    }
  });

  /**
   * Proxy the name property to the input element.
   */
  Object.defineProperty( proto, 'name', {
    get: function() {
      return this.getAttribute('name');
    },
    set: function(value) {
      this.setAttribute('name', value);
    }
  });

  var template = document.createElement('template');

  template.innerHTML =
    '<label for="the-checkbox" id="checkbox-label" class="pack-checkbox">' +
      '<input id="the-checkbox" type="checkbox">' +
      '<span><content select="label"></content></span>' +
    '</label>';

  // Register and return the constructor
  return document.registerElement('gaia-checkbox', { prototype: proto });
})(window);

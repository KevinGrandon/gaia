'use strict';
/* global module */

var Actions = require('marionette-client').Actions;

function Collection(client, server) {
  this.client = client;
  this.server = server;
  this.actions = new Actions(client);
}

/**
 * @type String Origin of Collection app
 */
Collection.URL = 'app://collection.gaiamobile.org';

Collection.Selectors = {
  contextMenuTarget: '#icons',
  menuAddButton: '#create-smart-collection'
};

Collection.prototype = {

  enterCreateScreen: function() {
    var selectors = Collection.Selectors;
    var container = client.helper.waitForElement(selectors.contextMenuTarget);
    this.actions.longPress(container, 1).perform();

    client.helper.waitForElement(selectors.menuAddButton).click();
  }


};

module.exports = Collection;

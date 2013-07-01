/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;
let Cm = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

function debug(data) {
	dump('ffduino: ' + data + '\n');
}

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

debug('Creating navigator.arduino.')

window.navigator.__defineGetter__('ffduino', function(prop) {
  return Ffduino
});

function Ffduino() {

}

Ffduino.prototype = {
	
}
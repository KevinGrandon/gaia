/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;
let Cm = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

function debug(data) {
	window.console.log(arguments)
	dump('ffduino: ' + data + '\n');
}

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

debug('Creating navigator.ffduino.')

var REPORT_VERSION = 0xF9

function Ffduino() {
	debug('Initting ffduino class!')
	var device = '/dev/tty.usbmodem411'; // or '\\.\COM1' on windows

	this.file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	this.file.initWithPath(device);
	debug('Made file ' + this.file)

	// Input stream for reading
	var inStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
	debug('About to make input stream ' + inStream)
	inStream.init(this.file, -1, 0, 0); // RDONLY

	debug('Made input stream ' + inStream)

	var observer = {
		onStartRequest:  function(request, context) {
			debug('Start request')
		},
		onStopRequest:   function(request, context, status) {
			debug('Stop request')
		},
		onDataAvailable: function(request, context, inputStream, offset, count) {
			debug('Data available')
			var binInStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
			binInStream.setInputStream(inputStream);
			var aBytes = binInStream.readByteArray(count);
			binInStream.close();
			inputStream.close();

			debug('Got: ' + aBytes);
		}
	}

	/*
	var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
	pump.init(inStream, -1, 2, 0, 0, false); // read 2 bytes
	pump.asyncRead(observer, null);
	*/
	debug('Reporting version')
	this.reportVersion()
}

Ffduino.prototype = {

	write: function(data) {
		debug('writing data ' + data)

		var outStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream)
		outStream.init(this.file, 0x02 | 0x10, 0664, 0)

		var binOutStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream)
		binOutStream.setOutputStream(outStream)

		binOutStream.write(data, data.length)

		binOutStream.close()
		outStream.close()
	},

	reportVersion: function() {
		this.write(REPORT_VERSION)
	},

	/**
	 * Digital High signal
	 */
	high: function digitalHigh(pin) {
	},

	/**
	 * Digital Low signal
	 */
	low: function digitalLow(pin) {

	}
	
}

window.navigator.__defineGetter__('ffduino', function(prop) {
  return Ffduino
});

debug('MADE SHIM : ' + window.navigator.ffduino)

try {
var testme = new Ffduino()
testme.high()

} catch(e) {
	debug('Got error! : ' + e)
}
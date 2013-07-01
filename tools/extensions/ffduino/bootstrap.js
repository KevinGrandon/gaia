const CC = Components.Constructor;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

const kChromeRootPath = 'chrome://ffduino.js/content/';

function debug(data) {
	dump('ffduino: ' + data + '\n');
}

function startup(data, reason) {
	debug('Starting.')

 	Services.obs.addObserver(function(document) {
		// Some documents like XBL don't have location and should be ignored
		if (!document.location || !document.defaultView)
			return;

		let currentDomain = document.location.toString();
		let window = document.defaultView;

		debug('+++ loading scripts for app: ' + currentDomain + "\n");
		// Inject mocks based on domain
		Services.scriptloader.loadSubScript('chrome://ffduino.js/content/ffduino.js', window.wrappedJSObject);

	}, 'document-element-inserted', false);

	/*
	var timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
	timer.initWithCallback(function() {
			Services.scriptloader.loadSubScript('chrome://ffduino.js/content/ffduino.js', {});
	}, 1000, Ci.nsITimer.TYPE_ONE_SHOT);
	*/
}

function shutdown(data, reason) {
}

function install(data, reason) {
}

function uninstall(data, reason) {
}

/*
function startFfduino() {
	dump('OMG STARTING!!!!')
	return
	var device = '/dev/ttyS0'; // or '\\.\COM1' on windows
	const Cc = Components.classes;
	const Ci = Components.interfaces;

	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	file.initWithPath(device);

	var outStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
	outStream.init(file, 0x02 | 0x10, 0664, 0); // WRONLY | APPEND

	var binOutStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
	binOutStream.setOutputStream(outStream);

	var data = "Hello";
	binOutStream.write(data, data.length);

	binOutStream.close();
	outStream.close();


	// Read from serial port

	var inStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
	inStream.init(file, -1, 0, 0); // RDONLY

	var observer = {
		onStartRequest:  function(request, context) {},
		onStopRequest:   function(request, context, status) {},
		onDataAvailable: function(request, context, inputStream, offset, count) {
			var binInStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
			binInStream.setInputStream(inputStream);
			var aBytes = binInStream.readByteArray(count);
			binInStream.close();
			inputStream.close();
			alert('Got: ' + aBytes);
		}
	};

	/*
	var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
	pump.init(inStream, -1, 2, 0, 0, false); // read 2 bytes
	pump.asyncRead(observer, null);

	// Abort read from serial port (not working, the onStopRequest callback is
	// being executed but something remains waiting for data on background)
	pump.cancel(Components.results.NS_BINDING_ABORTED);
	inStream.close();
	
}

/*
/Applications/Firefox.app/Contents/MacOS/firefox -profile /Users/savagekabbage/Library/Application\ Support/Firefox/Profiles/dpfw1imy.Development
*/

const DB_NAME = 'fastcontacts';
const DB_STORE_CONTACTS = 'fastcontacts';
const DB_VERSION = 1;

function debug() {
  var content = '';
  content = Array.prototype.join.call(arguments, ' ');
  dump(content + '\n');
}

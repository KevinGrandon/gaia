function debug() {
  var content = '';
  content = Array.prototype.join.call(arguments, ' ');
  dump(content + '\n');
}

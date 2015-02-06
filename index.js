'use strict';

var transform = require('./transform').transform;
var through = require('through');

module.exports = function (file, options) {

  if (/\.json$/.test(file)) {
    return through();
  }

  var data = '';
  function write(chunk) {
    return data += chunk;
  }

  function compile() {
    try {
      var transformed = transform(data, options);
      this.queue(transformed);
    } catch (error) {
      error.name = 'FlowcheckError';
      error.message = file + ': ' + error.message;
      error.fileName = file;
      this.emit('error', error);
    }
    return this.queue(null);
  }

  return through(write, compile);
};

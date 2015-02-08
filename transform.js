'use strict';

var jstransform = require('jstransform');
var visitorList = require('./visitors').visitorList;
var Buffer = require('buffer').Buffer;

function getOptions(options) {
  options = options || {};
  options.namespace =   options.namespace || '_f';
  options.sourceMap =   options['source-map'] || options.sourceMap;
  options.module =      options.module || 'flowcheck/assert';
  options.skipImport =  options['skip-import'] || options.skipImport;
  return options;
}

function innerTransform(input, options) {
  return jstransform.transform(visitorList, input, getOptions(options));
}

function inlineSourceMap(sourceMap, sourceCode, sourceFilename) {
  var json = sourceMap.toJSON();
  json.sources = [sourceFilename];
  json.sourcesContent = [sourceCode];
  var base64 = new Buffer(JSON.stringify(json)).toString('base64');
  return '//# sourceMappingURL=data:application/json;base64,' +
         base64;
}

module.exports = {

  transform: function(input, options) {
    var output = innerTransform(input, options);
    var result = output.code;
    if (options && options.sourceMap) {
      var map = inlineSourceMap(
        output.sourceMap,
        input,
        options.sourceFilename
      );
      result += '\n' + map;
    }
    return result;
  },

  transformWithDetails: function(input, options) {
    var output = innerTransform(input, options);
    var result = {};
    result.code = output.code;
    if (options && options.sourceMap) {
      result.sourceMap = output.sourceMap.toJSON();
    }
    return result;
  }

};

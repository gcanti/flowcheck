'use strict';

var jstransform = require('jstransform');
var visitorList = require('./visitors').visitorList;

function transform(source, options) {
  options = options || {};
  options.typeAssertionModule = options.typeAssertionModule || 'dike';
  options.typeAssertionVariable = options.typeAssertionVariable || 't';
  return jstransform.transform(
    visitorList,
    source,
    options
  );
}

module.exports = transform;
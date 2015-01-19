'use strict';

var jstransform = require('jstransform');
var typeSyntax = require('jstransform/visitors/type-syntax');
var visitorList = require('./visitors').visitorList;

function transform(source, options) {

  options = options || {};
  options.typeAssertionModule = options['type-assertion-module'] || options.typeAssertionModule || 'flowtype/assert';
  options.typeAssertionVariable = options['type-assertion-variable'] || options.typeAssertionVariable || 'f';
  options.sourceMap = true;

  var code = jstransform.transform(visitorList, source, options).code;
  // stripping types needs to happen after the other transforms
  if (options['strip-types'] || options.stripTypes) {
    code = jstransform.transform(typeSyntax.visitorList, code).code;
  }
  return code;
}

module.exports = transform;
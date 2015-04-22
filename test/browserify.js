'use strict';

var tape = require('tape');
var browserify = require('browserify');
var reactify = require('reactify');
var babelify = require('babelify');
var flowcheck = require('../index');

function contains(tape, bundle, code) {
  bundle = bundle.toString();
  tape.ok(bundle.indexOf(code) > -1, 'bundle should contain: ' + code);
}

tape('browserify', function (tape) {
  tape.plan(3);

  tape.test('should transform a file with reactify', function (tape) {
    tape.plan(2);
    browserify('./fixtures/main.js', {basedir: __dirname})
    .transform(flowcheck, {skipImport: true})
    .transform(reactify, {
      stripTypes: true
    })
    .bundle(function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, 'var x         = _f.check(1, _f.string);');
    });
  });

  tape.test('should transform a file with 6to5', function (tape) {
    tape.plan(2);
    browserify('./fixtures/main.js', {basedir: __dirname})
    .transform(flowcheck, {skipImport: true})
    .transform(babelify)
    .bundle(function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, 'var x = _f.check(1, _f.string);');
    });
  });

  tape.test('shouldn\'t die if requiring JSON', function (tape) {
    tape.plan(2);
    browserify('./fixtures/main.json', {basedir: __dirname})
    .transform(flowcheck)
    .bundle(function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, '{"a": 1}');
    });
  });

});
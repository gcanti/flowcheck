var tape = require('tape');
var browserify = require('browserify');
var reactify = require('reactify');
var to5ify = require('6to5ify');
var flowcheck = require('../index');

function contains(tape, bundle, code) {
  bundle = bundle.toString();
  tape.ok(bundle.indexOf(code) > -1, 'bundle should contain: ' + code);
}

tape('browserify', function (tape) {
  tape.plan(2);

  tape.test('should transform a file with reactify', function (tape) {
    tape.plan(2);
    browserify('./fixtures/main.js', {basedir: __dirname})
    .transform(flowcheck)
    .transform(reactify, {
      stripTypes: true
    })
    .bundle(function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, 'var x         = f.check(1, f.string);');
    });
  });

  tape.test('should transform a file with 6to5', function (tape) {
    tape.plan(2);
    browserify('./fixtures/main.js', {basedir: __dirname})
    .transform(flowcheck)
    .transform(to5ify)
    .bundle(function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, 'var x = f.check(1, f.string);');
    });
  });

});
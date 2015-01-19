var tape = require('tape');
var browserify = require('browserify');
var flowcheck = require('../index');

function bundle(entry, cb) {
  return browserify(entry, {basedir: __dirname})
    .transform(flowcheck, {
      stripTypes: true
    })
    .bundle(cb);
};

function normalizeWhitespace(src) {
  return src.replace(/\n/g, '').replace(/ +/g, '');
}

function contains(tape, bundle, code) {
  bundle = bundle.toString();
  tape.ok(bundle.indexOf(code) > -1, 'bundle should contain: ' + code);
}

tape('flowcheck', function (tape) {
  tape.plan(1);

  tape.test('should transform a file', function (tape) {
    tape.plan(2);
    bundle('./fixtures/main.js', function(err, result) {
      tape.ok(!err, 'should not fail');
      contains(tape, result, 'var x         = f.check(1, f.string);');
    });
  });

});
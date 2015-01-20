var tape = require('tape');
var f = require('../assert');

tape('list', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    f.list(f.number).name,
    'Array<number>',
    'should set a default name'
  );

  tape.strictEqual(
    f.list(f.number, 'MyList').name,
    'MyList',
    'should set a specified name'
  );

  tape.strictEqual(
    f.list(f.number).validate(1) + '',
    'Expected an instance of array got 1, context: Array<number>',
    'should fail if x is not an array'
  );

  tape.strictEqual(
    f.list(f.number).validate([1, 's']) + '',
    'Expected an instance of number got "s", context: Array<number> / 1',
    'should fail if an element of x is not an instance of T'
  );

  tape.strictEqual(
    f.list(f.number).validate([1, 2]),
    null,
    'should succeed if x is a list of T'
  );

});

tape('maybe', function (tape) {

  tape.plan(6);

  tape.strictEqual(
    f.maybe(f.number).name,
    '?number',
    'should set a default name'
  );

  tape.strictEqual(
    f.maybe(f.number, 'MyMaybe').name,
    'MyMaybe',
    'should set a specified name'
  );

  tape.strictEqual(
    f.maybe(f.number).validate('s') + '',
    'Expected an instance of number got "s", context: ?number',
    'should fail if x is not an instance of T'
  );

  tape.strictEqual(
    f.maybe(f.number).validate(null),
    null,
    'should succeed if x is null'
  );

  tape.strictEqual(
    f.maybe(f.number).validate(undefined) + '',
    'Expected an instance of number got undefined, context: ?number',
    'should fail if x is undefined'
  );

  tape.strictEqual(
    f.maybe(f.number).validate(1),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('tuple', function (tape) {

  tape.plan(6);

  tape.strictEqual(
    f.tuple([f.string, f.number]).name,
    '[string, number]',
    'should set a default name'
  );

  tape.strictEqual(
    f.tuple([f.string, f.number], 'MyTuple').name,
    'MyTuple',
    'should set a specified name'
  );

  tape.strictEqual(
    f.tuple([f.string, f.number]).validate(1) + '',
    'Expected an instance of array got 1, context: [string, number]',
    'should fail if x is not an array'
  );

  tape.strictEqual(
    f.tuple([f.string, f.number]).validate(['s']) + '',
    'Expected an instance of [string, number] got ["s"], (no context)',
    'should fail if x is an array with wrong length'
  );

  tape.strictEqual(
    f.tuple([f.string, f.number]).validate([1, 2]) + '',
    'Expected an instance of string got 1, context: [string, number] / 0',
    'should fail if the i-th coordinate of x is not an instance of T[i]'
  );

  tape.strictEqual(
    f.tuple([f.string, f.number]).validate(['s', 1]),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('dict', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    f.dict(f.string, f.number).name,
    '{[key: string]: number}',
    'should set a default name'
  );

  tape.strictEqual(
    f.dict(f.string, f.number, 'MyDict').name,
    'MyDict',
    'should set a specified name'
  );

  tape.strictEqual(
    f.dict(f.string, f.number).validate(1) + '',
    'Expected an instance of object got 1, context: {[key: string]: number}',
    'should fail if x is not an object'
  );

  /* FIXME
  tape.strictEqual(
    f.dict(f.string, f.number).validate({}) + '',
    '',
    'should fail if a key of x is not an instance of domain'
  );
  */

  tape.strictEqual(
    f.dict(f.string, f.number).validate({a: 's'}) + '',
    'Expected an instance of number got "s", context: {[key: string]: number} / a',
    'should fail if a value of x is not an instance of codomain'
  );

  tape.strictEqual(
    f.dict(f.string, f.number).validate({a: 1, b: 2}),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('object', function (tape) {

  tape.plan(7);

  tape.strictEqual(
    f.object({a: f.number, b: f.string}).name,
    '{a: number; b: string;}',
    'should set a default name'
  );

  tape.strictEqual(
    f.object({a: f.number, b: f.string}, 'MyObject').name,
    'MyObject',
    'should set a specified name'
  );

  tape.strictEqual(
    f.object({a: f.number, b: f.string}).validate(1) + '',
    'Expected an instance of object got 1, context: {a: number; b: string;}',
    'should fail if x is not an object'
  );

  tape.strictEqual(
    f.object({a: f.number, b: f.string}).validate({a: 1, b: 2}) + '',
    'Expected an instance of string got 2, context: {a: number; b: string;} / b',
    'should fail if a key k of x is not an instance of T[k]'
  );

  tape.strictEqual(
    f.object({a: f.maybe(f.number)}).validate({}) + '',
    'Expected an instance of number got undefined, context: {a: ?number;} / a / ?number',
    'should fail if a key is not specified'
  );

  tape.strictEqual(
    f.object({a: f.number, b: f.string}).validate({a: 1, b: 's'}),
    null,
    'should succeed if x is an instance of T'
  );

  tape.strictEqual(
    f.object({a: f.number}).validate({a: 1, b: 's'}),
    null,
    'should succeed if x owns an additional property'
  );

});

tape('union', function (tape) {

  tape.plan(4);

  tape.strictEqual(
    f.union([f.string, f.number]).name,
    'string | number',
    'should set a default name'
  );

  tape.strictEqual(
    f.union([f.string, f.number], 'MyUnion').name,
    'MyUnion',
    'should set a specified name'
  );

  tape.strictEqual(
    f.union([f.string, f.number]).validate(false) + '',
    'Expected an instance of string | number got false, context: string | number',
    'should fail if x is not an instance of T'
  );

  tape.strictEqual(
    f.union([f.string, f.number]).validate(1),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('args', function (tape) {

  tape.plan(6);

  tape.strictEqual(
    f.args([f.number, f.string]).name,
    '(number, string, ...any)',
    'should set a proper name when varargs is not specified'
  );

  tape.strictEqual(
    f.args([f.number, f.string], f.boolean).name,
    '(number, string, ...boolean)',
    'should set a proper name when varargs is specified'
  );

  tape.test('should fail if x is not an instance of the arguments tuple', function (tape) {

    tape.plan(2);

    tape.strictEqual(
      f.args([f.string, f.number]).validate([]) + '',
      'Expected an instance of [string, number] got [], context: arguments'
    );

    tape.strictEqual(
      f.args([f.string, f.number]).validate([1]) + '',
      'Expected an instance of [string, number] got [1], context: arguments'
    );

  });

  tape.test('should succeed if x is an instance of the arguments tuple', function (tape) {

    tape.plan(2);

    tape.strictEqual(
      f.args([f.string, f.number]).validate(['s', 1]),
      null
    );

    tape.strictEqual(
      f.args([f.string, f.number]).validate(['s', 1, 2]),
      null
    );

  });

  tape.strictEqual(
    f.args([], f.string).validate([1]) + '',
    'Expected an instance of string got 1, context: varargs / Array<string> / 0',
    'should fail if x is not an instance of the varargs list'
  );

  tape.strictEqual(
    f.args([], f.string).validate(['a', 'b']),
    null,
    'should succeed if x is an instance of the varargs list'
  );


});



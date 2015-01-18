var tape = require('tape');
var t = require('../assert');

tape('list', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    t.list(t.number).name,
    'Array<number>',
    'should set a default name'
  );

  tape.strictEqual(
    t.list(t.number, 'MyList').name,
    'MyList',
    'should set a specified name'
  );

  tape.strictEqual(
    t.list(t.number).validate(1) + '',
    'Expected an instance of array in Array<number>, got `1`',
    'should fail if x is not an array'
  );

  tape.strictEqual(
    t.list(t.number).validate([1, 's']) + '',
    'Expected an instance of number in Array<number>.1, got `"s"`',
    'should fail if an element of x is not an instance of T'
  );

  tape.strictEqual(
    t.list(t.number).validate([1, 2]),
    null,
    'should succeed if x is a list of T'
  );

});

tape('maybe', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    t.maybe(t.number).name,
    '?number',
    'should set a default name'
  );

  tape.strictEqual(
    t.maybe(t.number, 'MyMaybe').name,
    'MyMaybe',
    'should set a specified name'
  );

  tape.strictEqual(
    t.maybe(t.number).validate('s') + '',
    'Expected an instance of number, got `"s"`',
    'should fail if x is not an instance of T'
  );

  tape.strictEqual(
    t.maybe(t.number).validate(null),
    null,
    'should succeed if x is null'
  );

  tape.strictEqual(
    t.maybe(t.number).validate(1),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('tuple', function (tape) {

  tape.plan(6);

  tape.strictEqual(
    t.tuple([t.string, t.number]).name,
    '[string, number]',
    'should set a default name'
  );

  tape.strictEqual(
    t.tuple([t.string, t.number], 'MyTuple').name,
    'MyTuple',
    'should set a specified name'
  );

  tape.strictEqual(
    t.tuple([t.string, t.number]).validate(1) + '',
    'Expected an instance of array in [string, number], got `1`',
    'should fail if x is not an array'
  );

  tape.strictEqual(
    t.tuple([t.string, t.number]).validate(['s']) + '',
    'Expected an instance of [string, number] in , got `["s"]`',
    'should fail if x is an array with wrong length'
  );

  tape.strictEqual(
    t.tuple([t.string, t.number]).validate([1, 2]) + '',
    'Expected an instance of string in [string, number].0, got `1`',
    'should fail if the i-th coordinate of x is not an instance of T[i]'
  );

  tape.strictEqual(
    t.tuple([t.string, t.number]).validate(['s', 1]),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('dict', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    t.dict(t.string, t.number).name,
    '{[key: string]: number}',
    'should set a default name'
  );

  tape.strictEqual(
    t.dict(t.string, t.number, 'MyDict').name,
    'MyDict',
    'should set a specified name'
  );

  tape.strictEqual(
    t.dict(t.string, t.number).validate(1) + '',
    'Expected an instance of object in {[key: string]: number}, got `1`',
    'should fail if x is not an object'
  );

  /* FIXME
  tape.strictEqual(
    t.dict(t.string, t.number).validate({}) + '',
    '',
    'should fail if a key of x is not an instance of domain'
  );
  */

  tape.strictEqual(
    t.dict(t.string, t.number).validate({a: 's'}) + '',
    'Expected an instance of number in {[key: string]: number}.a, got `"s"`',
    'should fail if a value of x is not an instance of codomain'
  );

  tape.strictEqual(
    t.dict(t.string, t.number).validate({a: 1, b: 2}),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('object', function (tape) {

  tape.plan(5);

  tape.strictEqual(
    t.object({a: t.number, b: t.string}).name,
    '{a: number; b: string;}',
    'should set a default name'
  );

  tape.strictEqual(
    t.object({a: t.number, b: t.string}, 'MyObject').name,
    'MyObject',
    'should set a specified name'
  );

  tape.strictEqual(
    t.object({a: t.number, b: t.string}).validate(1) + '',
    'Expected an instance of object in {a: number; b: string;}, got `1`',
    'should fail if x is not an object'
  );

  tape.strictEqual(
    t.object({a: t.number, b: t.string}).validate({a: 1, b: 2}) + '',
    'Expected an instance of string in {a: number; b: string;}.b, got `2`',
    'should fail if a key k of x is not an instance of T[k]'
  );

  tape.strictEqual(
    t.object({a: t.number, b: t.string}).validate({a: 1, b: 's'}),
    null,
    'should succeed if x is an instance of T'
  );

});

tape('union', function (tape) {

  tape.plan(4);

  tape.strictEqual(
    t.union([t.string, t.number]).name,
    'string | number',
    'should set a default name'
  );

  tape.strictEqual(
    t.union([t.string, t.number], 'MyUnion').name,
    'MyUnion',
    'should set a specified name'
  );

  tape.strictEqual(
    t.union([t.string, t.number]).validate(false) + '',
    'Expected an instance of string | number in string | number, got `false`',
    'should fail if x is not an instance of T'
  );

  tape.strictEqual(
    t.union([t.string, t.number]).validate(1),
    null,
    'should succeed if x is an instance of T'
  );

});

var tape = require('tape');
var originalTransform = require('../transform').transform;

var transform = function (input) {
  return originalTransform(input, {
    skipImport: true
  });
};

tape('options', function (tape) {

  tape.plan(3);

  tape.strictEqual(
    originalTransform('var x: string = "a";', {namespace: 't', skipImport: true}),
    'var x: string = t.check("a", t.string);',
    'should handle namespace option'
  );

  tape.strictEqual(
    originalTransform('var x: number = 1;', {module: 'a/b'}),
    'var _f = require("a/b");\n\nvar x: number = _f.check(1, _f.number);',
    'should handle module option'
  );

  tape.strictEqual(
    originalTransform('var x: boolean = true;', {target: 'es3', skipImport: true}),
    'var x: boolean = _f.check(true, _f["boolean"]);',
    'should handle target option'
  );

});

tape('variables', function (tape) {
  tape.plan(7);

  tape.strictEqual(
    transform('var x: string = "a";'),
    'var x: string = _f.check("a", _f.string);',
    'string type'
  );

  tape.strictEqual(
    transform('var x: number = 1;'),
    'var x: number = _f.check(1, _f.number);',
    'number type'
  );

  tape.strictEqual(
    transform('var x: boolean = true;'),
    'var x: boolean = _f.check(true, _f.boolean);',
    'boolean type'
  );

  tape.strictEqual(
    transform('var x: void = undefined;'),
    'var x: void = _f.check(undefined, _f.void);',
    'void type'
  );

  tape.strictEqual(
    transform('var x: mixed = null;'),
    'var x: mixed = _f.check(null, _f.mixed);',
    'mixed type'
  );

  tape.strictEqual(
    transform('var x: Object = null;'),
    'var x: Object = _f.check(null, _f.object);',
    'Object type'
  );

  tape.strictEqual(
    transform('var x: Function = null;'),
    'var x: Function = _f.check(null, _f.function);',
    'Function type'
  );

});

tape('lists', function (tape) {
  tape.plan(4);

  tape.strictEqual(
    transform('var x: Array = [\'a\'];'),
    'var x: Array = _f.check([\'a\'], _f.list(_f.any));',
    'Array'
  );

  tape.strictEqual(
    transform('var x: string[] = [];'),
    'var x: string[] = _f.check([], _f.list(_f.string));',
    'array type ([] syntax)'
  );

  tape.strictEqual(
    transform('var x: Array<string> = [];'),
    'var x: Array<string> = _f.check([], _f.list(_f.string));',
    'array type (Array<> syntax)'
  );

  tape.throws(function () {
    transform('var a: Array<T, U> = [];');
  }, 'should throw if there are more than 1 type parameter');

});

tape('maybe types', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: ?string = null;'),
    'var x: ?string = _f.check(null, _f.maybe(_f.string));',
    'should handle a nullable type'
  );

});

tape('optional types', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('function foo(a?: string) {}'),
    'function foo(a?: string) {_f.check(arguments, _f.arguments([_f.optional(_f.string)]));}',
    'should handle an optional function parameter'
  );

});

tape('dictionaries', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: {[key: string]: number} = {a: 1, b: 2};'),
    'var x: {[key: string]: number} = _f.check({a: 1, b: 2}, _f.dict(_f.string, _f.number));',
    'should handle dictionaries'
  );

});

tape('shapes', function (tape) {
  tape.plan(2);

  tape.strictEqual(
    transform('var x: {a: string; b: number;} = {};'),
    'var x: {a: string; b: number;} = _f.check({}, _f.shape({a: _f.string, b: _f.number}));',
    'should handle shapes'
  );

  tape.strictEqual(
    transform('type MyType = {"foo-bar": number;};'),
    'type MyType = {"foo-bar": number;};var MyType = _f.shape({"foo-bar": _f.number});',
    'should escape literal keys'
  );

});

tape('tuples', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: [string, number] = [];'),
    'var x: [string, number] = _f.check([], _f.tuple([_f.string, _f.number]));',
    'tuple'
  );

});

tape('unions', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: string | number = 1;'),
    'var x: string | number = _f.check(1, _f.union([_f.string, _f.number]));',
    'union'
  );

});

tape('functions', function (tape) {
  tape.plan(9);

  tape.strictEqual(
    transform('function fn(s: string) { return s; } // comment'),
    'function fn(s: string) {_f.check(arguments, _f.arguments([_f.string])); return s; } // comment',
    'definition, only arguments'
  );

  tape.strictEqual(
    transform('function fn(s: string): string { return s; } // comment'),
    'function fn(s: string): string {_f.check(arguments, _f.arguments([_f.string])); var ret = (function (s) { return s; }).apply(this, arguments); return _f.check(ret, _f.string);} // comment',
    'definition, arguments and return type'
  );

  tape.strictEqual(
    transform('var fn = function (n: number) { return n; }; // comment'),
    'var fn = function (n: number) {_f.check(arguments, _f.arguments([_f.number])); return n; }; // comment',
    'expression, only arguments'
  );

  tape.strictEqual(
    transform('var fn = function (n: number): number { return n; }; // comment'),
    'var fn = function (n: number): number {_f.check(arguments, _f.arguments([_f.number])); var ret = (function (n) { return n; }).apply(this, arguments); return _f.check(ret, _f.number);}; // comment',
    'expression, arguments and return type'
  );

  tape.strictEqual(
    transform('var fn = function (...n: number): number { return 1; }; // comment'),
    'var fn = function (...n: number): number {_f.check(arguments, _f.arguments([], _f.number)); var ret = (function () { return 1; }).apply(this, arguments); return _f.check(ret, _f.number);}; // comment',
    'expression, varargs'
  );

  tape.strictEqual(
    transform('var n: number = (function (n: number) { return n; })(1); // comment'),
    'var n: number = _f.check((function (n: number) {_f.check(arguments, _f.arguments([_f.number])); return n; })(1), _f.number); // comment',
    'called expression'
  );

  tape.strictEqual(
    transform('function bar(...w: number) {}'),
    'function bar(...w: number) {_f.check(arguments, _f.arguments([], _f.number));}',
    'variadic'
  );

  tape.strictEqual(
    transform('function map(fn: (x: T) => U) {}'),
    'function map(fn: (x: T) => U) {_f.check(arguments, _f.arguments([_f.function]));}',
    'should convert a generic function to the function type'
  );

  tape.strictEqual(
    transform('function foo<T>(x: T) { return x; }'),
    'function foo<T>(x: T) {_f.check(arguments, _f.arguments([_f.any])); return x; }',
    'should handle polymorphic functions'
  );

});

tape('type alias', function (tape) {
  tape.plan(2);

  tape.strictEqual(
    transform('type X = Array<number>;'),
    'type X = Array<number>;var X = _f.list(_f.number);',
    'basic'
  );

  tape.strictEqual(
    transform('type X = A<Y>;'),
    'type X = A<Y>;var X = A;',
    'generics'
  );

});

tape('classes', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('class C<X> { foo(x: X): X { this.x = x; } }'),
    'class C<X> { foo(x: X): X {_f.check(arguments, _f.arguments([_f.any])); var ret = (function (x) { this.x = x; }).apply(this, arguments); return _f.check(ret, _f.any);} }',
    'should handle polymorphic classes'
  );

});


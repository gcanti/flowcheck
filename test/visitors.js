var tape = require('tape');
var transform = require('../transform').transform;

tape('variables', function (tape) {
  tape.plan(7);

  tape.strictEqual(
    transform('var x: string = "a";'),
    'var x: string = f.check("a", f.string);',
    'string type'
  );

  tape.strictEqual(
    transform('var x: number = 1;'),
    'var x: number = f.check(1, f.number);',
    'number type'
  );

  tape.strictEqual(
    transform('var x: boolean = true;'),
    'var x: boolean = f.check(true, f.boolean);',
    'boolean type'
  );

  tape.strictEqual(
    transform('var x: void = undefined;'),
    'var x: void = f.check(undefined, f.void);',
    'void type'
  );

  tape.strictEqual(
    transform('var x: mixed = null;'),
    'var x: mixed = f.check(null, f.mixed);',
    'mixed type'
  );

  tape.strictEqual(
    transform('var x: Object = null;'),
    'var x: Object = f.check(null, f.object);',
    'Object type'
  );

  tape.strictEqual(
    transform('var x: Function = null;'),
    'var x: Function = f.check(null, f.function);',
    'Function type'
  );

});

tape('lists', function (tape) {
  tape.plan(4);

  tape.strictEqual(
    transform('var x: Array = [\'a\'];'),
    'var x: Array = f.check([\'a\'], f.list(f.any));',
    'Array'
  );

  tape.strictEqual(
    transform('var x: string[] = [];'),
    'var x: string[] = f.check([], f.list(f.string));',
    'array type ([] syntax)'
  );

  tape.strictEqual(
    transform('var x: Array<string> = [];'),
    'var x: Array<string> = f.check([], f.list(f.string));',
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
    'var x: ?string = f.check(null, f.maybe(f.string));',
    'should handle a nullable type'
  );

});

tape('optional types', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('function foo(a?: string) {}'),
    'function foo(a?: string) {f.check(arguments, f.arguments([f.optional(f.string)]));}',
    'should handle an optional function parameter'
  );

});

tape('dictionaries', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: {[key: string]: number} = {a: 1, b: 2};'),
    'var x: {[key: string]: number} = f.check({a: 1, b: 2}, f.dict(f.string, f.number));',
    'should handle dictionaries'
  );

});

tape('shapes', function (tape) {
  tape.plan(2);

  tape.strictEqual(
    transform('var x: {a: string; b: number;} = {};'),
    'var x: {a: string; b: number;} = f.check({}, f.shape({a: f.string, b: f.number}));',
    'should handle shapes'
  );

  tape.strictEqual(
    transform('type MyType = {"foo-bar": number;};'),
    'type MyType = {"foo-bar": number;};var MyType = f.shape({"foo-bar": f.number});',
    'should escape literal keys'
  );

});

tape('tuples', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: [string, number] = [];'),
    'var x: [string, number] = f.check([], f.tuple([f.string, f.number]));',
    'tuple'
  );

});

tape('unions', function (tape) {
  tape.plan(1);

  tape.strictEqual(
    transform('var x: string | number = 1;'),
    'var x: string | number = f.check(1, f.union([f.string, f.number]));',
    'union'
  );

});

tape('functions', function (tape) {
  tape.plan(9);

  tape.strictEqual(
    transform('function fn(s: string) { return s; } // comment'),
    'function fn(s: string) {f.check(arguments, f.arguments([f.string])); return s; } // comment',
    'definition, only arguments'
  );

  tape.strictEqual(
    transform('function fn(s: string): string { return s; } // comment'),
    'function fn(s: string): string {f.check(arguments, f.arguments([f.string])); var ret = (function (s) { return s; }).apply(this, arguments); return f.check(ret, f.string);} // comment',
    'definition, arguments and return type'
  );

  tape.strictEqual(
    transform('var fn = function (n: number) { return n; }; // comment'),
    'var fn = function (n: number) {f.check(arguments, f.arguments([f.number])); return n; }; // comment',
    'expression, only arguments'
  );

  tape.strictEqual(
    transform('var fn = function (n: number): number { return n; }; // comment'),
    'var fn = function (n: number): number {f.check(arguments, f.arguments([f.number])); var ret = (function (n) { return n; }).apply(this, arguments); return f.check(ret, f.number);}; // comment',
    'expression, arguments and return type'
  );

  tape.strictEqual(
    transform('var fn = function (...n: number): number { return 1; }; // comment'),
    'var fn = function (...n: number): number {f.check(arguments, f.arguments([], f.number)); var ret = (function () { return 1; }).apply(this, arguments); return f.check(ret, f.number);}; // comment',
    'expression, varargs'
  );

  tape.strictEqual(
    transform('var n: number = (function (n: number) { return n; })(1); // comment'),
    'var n: number = f.check((function (n: number) {f.check(arguments, f.arguments([f.number])); return n; })(1), f.number); // comment',
    'called expression'
  );

  tape.strictEqual(
    transform('function bar(...w: number) {}'),
    'function bar(...w: number) {f.check(arguments, f.arguments([], f.number));}',
    'variadic'
  );

  tape.strictEqual(
    transform('function map(fn: (x: T) => U) {}'),
    'function map(fn: (x: T) => U) {f.check(arguments, f.arguments([f.function]));}',
    'should convert a generic function to the function type'
  );

  tape.strictEqual(
    transform('function foo<T>(x: T) { return x; }'),
    'function foo<T>(x: T) {f.check(arguments, f.arguments([f.any])); return x; }',
    'should handle polymorphic functions'
  );

});

tape('type alias', function (tape) {
  tape.plan(2);

  tape.strictEqual(
    transform('type X = Array<number>;'),
    'type X = Array<number>;var X = f.list(f.number);',
    'basic'
  );

  tape.strictEqual(
    transform('type X = A<Y>;'),
    'type X = A<Y>;var X = A;',
    'generics'
  );

});

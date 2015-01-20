# Why?

Use types annotations today, even if you don't actually use Flow (or TypeScript). Then strip the assertions in production.

Flowcheck comes with a built-in browserify transformer and supports sourcemaps for a seamless workflow integration.

You can even use Flowcheck as a general purpose validation library.

# How it works?

Flowcheck adds asserts for each type annotation using jstransform.

If an assert fails the debugger kicks in so you can inspect the stack and quickly find out what's wrong.

# Workflow

1. Write your code adding type annotations
2. (optional) enable the Flow static type checker
3. enable Flowcheck.js and strip type annotations (with react-tools or 6to5) during development
4. disable Flowcheck.js in production for zero overhead

# Roadmap

- core
  - handle `Object`, `Function` type annotations
  - tuples must have at most 8 elements
  - handle typed class members (e.g `class C { x: string; }`)
  - handle intersection types
  - handle declarations
  - add some (opt-in) extra features derived from [tcomb](https://github.com/gcanti/tcomb) (notably subtypes)
  - automatic import of flowcheck/assert module
  - tests, tests and tests
  - even more tests
- polymorphic
  - handle polymorphic functions (e.g. `function foo<X>(x: X): X { return x; }`)
  - handle polymorphic classes (e.g. `class C<X> { x: X; }`)
- tooling
  - gulp plugin
  - require hook (?)

# Modules

- a **source transformer** (transform.js)
- a **browserify transformer** (index.js)
- a **runtime assertion library** (assert.js)

The transformer adds assertions for each type annotation.

The assertion module checks the types at runtime. If an assert fails **the debugger kicks in** so you can inspect the stack and quickly find out what's wrong.

A type is represented by an object with 2 properties:

- name: string
- validate: function

The validate function has the following signature:

```js
validate(x: any, ctx: ?Array<any>, fast: ?boolean): ?Array<Failure>
```

where

```js
Failure = {
  actual: any;
  expected: Type;
  path: Array<string | number>;
}
```

# API

`transform(source: string, options: ?object): string`

Options:

- `namespace`: string (default `f`)
- `sourceMap`: boolean (default `false`)

# Assert library API

`f.define(name: string, is: (x: any) => boolean): Type`

Defines a new basic type.

`f.check(value: T, type: Type): T`

- by default `instanceof` is used to check the type
- if `type` owns a static `is(x: any)`, it will be used  to check the type
- if `value` is not of type `type`, `f.fail` will be called with a meaningful error message

`f.list(type: Type, name: ?string): Type`

Returns a type representing the list `Array<type>`.

`f.tuple(types: Array<Type>, name: ?string): Type`

Returns a type representing the tuple `[...types]`.

`f.object(props: {[key:string]: Type}): Type`

Returns a type representing the object `{p1: T1, p2: T2, ... p3: T3}`.

`f.dict(domain: Type, codomain: Type, name: ?string): Type`

Returns a type representing the dictionary type `{[key: domain]: codomain}`.

`f.maybe(type: Type, name: ?string): Type`

Returns a type representing the nullable type `?type`.

`f.union(types: Array<Type>, name: ?string): Type`

Returns a type representing the union `T1 | T2 | ... | Tn`.

# Transformations

## Basic types

- number
- string
- boolean
- void
- any
- mixed

```js
var f = require('flowcheck/assert');

var x: type = y;
// =>
var x = f.check(y, f.<type>);
```

## Arrays

```js
var x: Array<T> = y;
// or
var x: T[] = y;
// =>
var x = f.check(y, f.list(T));
```

## Tuples

```js
var x: [T1, T2, ...] = y;
// =>
var x = f.check(y, f.tuple([T1, T2, ...]));
```

## Classes

```js
var x: T = y;
// =>
var x = f.check(y, T);
```

## Objects

```js
var x: {p1: T1; p2: T2; ... pn: Tn;} = y;
// =>
var x = f.check(y, f.object({p1: T1, p2: T2, ... pn: Tn}));
```

## Dictionaries

```js
var x: {[key:D]: C} = y;
// =>
var x = f.check(y, f.dict(D, C));
```

## Maybe types

```js
var x: ?T = y;
// =>
var x = f.check(y, f.maybe(T));
```

## Unions

```js
var x: T1 | T2 | ... | Tn = y;
// =>
var x = f.check(y, f.union([T1, T2, ... , Tn]));
```

## Functions

```js
function f(x1: T1, x2: T2, ... , xn: Tn): R {
  return x;
}
// =>
function f(x1: T1, x2: T2, ... , xn: Tn): R {
  f.check(arguments, f.args([T1, T2, ... , Tn]));
  var ret = (function (x1, x2, ... , xn) {
    return x;
  }).apply(this, arguments);
  return f.check(ret, R);
}
```

# Type aliases

```js
type T = Array<string>;
// =>
var T = f.list(f.string);
```

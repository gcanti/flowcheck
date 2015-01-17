# The Idea

A set / type is an object with a static function

```
validate(x: any, ctx: ?Array<any>, fast: ?boolean): Validation
```

```js
type Failure = {actual: any; expected: Type, path: Array<string>}
type Validation = {value: any, errors: Array<ValidationError>, ok: boolean}
```

# Transformations

## Basic types

Primitives start with a lowercase letter.

- number
- string
- boolean
- void
- any
- mixed

```js
var x: type = y;
// transformed to
var x = assert.type(y, assert[type]);

// example
var x: number = 1;
// transformed to
var x = assert.type(1, assert.number);
```

## Arrays

```js
var x: Array<T> = y;
// transformed to
var x = assert.type(y, assert.list(T));

// example
var x: Array<string> = [];
// transformed to
var x = assert.type([], assert.list(assert.string));
```

## Tuples

```js
var x: [T1, T2, ...] = y;
// transformed to
var x = assert.type(y, assert.tuple([T1, T2, ...]));

// example
var x: [string, number] = ['a', 1];
// transformed to
var x = assert.type(['a', 1], assert.tuple([assert.string, assert.number]));
```

## Classes

Classes start with a uppercase letter.

```js
var x: T = y;
// transformed to
var x = assert.type(y, T);

// example
function Person() {}
var x: Person = new Person();
// transformed to
var x = assert.type(new Person(), Person);
```

## Objects

```js
var x: {p1: T1; p2: T2; ... pn: Tn;} = y;
// transformed to
var x = assert.type(y, assert.object({p1: T1, p2: T2, ... pn: Tn}));

// example
var x: {a: string; b: number;} = {a: 'a', b: 1};
// transformed to
var x = assert.type({a: 'a', b: 1}, assert.object({
  a: assert.string,
  b: assert.number
}));
```

## Dictionaries

```js
var x: {[key:D]: C} = y;
// transformed to
var x = assert.type(y, assert.dict(D, C));

// example
var x: {[key:string]: number} = {a: 1, b: 2};
// transformed to
var x = assert.type({a: 1, b: 2}, assert.dict(assert.string, assert.number));
```

## Functions

```js
function f(x1: T1, x2: T2, ... xn: Tn): R {
  ...
  return x;
}
// transformed to
function f(x1, x2, ... xn) {
  x1 = assert.type(x1, T1);
  x2 = assert.type(x2, T2);
  ...
  xn = assert.type(xn, Tn);
  return assert.type((function f(x1, x2, ... xn){
    ...
    return x;
  })(x1, x2, ... xn), R);
}

// example
function foo(x: string): string {
  return x;
}
// transformed to
function foo(x) {
  x = assert.type(x, assert.string);
  return assert.type((function foo(x) {
    return x;
  })(x), assert.string);
}
```

## Maybe Types

```js
var x: ?type = y;
// transformed to
var x = assert.type(y, assert.maybe(type));

// example
var x: ?string = null;
// transformed to
var x = assert.type(null, assert.maybe(assert.string));
```

## Unions

```js
var x: T1 | T2 | ... | Tn = y;
// transformed to
var x = assert.type(y, assert.union([T1, T2, ... , Tn]));

// example
var x: string | number = 1;
// transformed to
var x = assert.type(1, assert.union([assert.string, assert.number]));
```

## Intersections

```js
var x: T1 & T2 & ... & Tn = y;
// transformed to
var x = assert.type(y, assert.intersection([T1, T2, ... , Tn]));

// example
var x: A & B = 1;
// transformed to
var x = assert.type(1, assert.intersection([A, B]));
```

# Type aliases

```js
type T = Array<string>;
// transformed to
var T = assert.list(assert.string);
```

# API

## `transform(source: string, options: ?object): string`

Strips the types from `source` optionally inserting type assertions.

### `options`

- "typeAssertions": boolean
- "typeAssertionModule": string
- "typeAssertionVariable": string

# Assert library API

## `assert.type(value: T, type: Type): T`

- by default `instanceof` is used to check the type
- if `type` owns a static `is(x: any)`, it will be used  to check the type
- if `value` is not of type `type`, `assert.fail` will be called with a meaningful error message

## `assert.list(type: Type, name: ?string): Type`

Returns a type representing the list `Array<type>`.

## `assert.tuple(types: Array<Type>, name: ?string): Type`

Returns a type representing the tuple `[...types]`.

## `assert.object(props: {[key:string]: Type}): Type`

Returns a type representing the object `{p1: T1, p2: T2, ... p3: T3}`.

## `assert.dict(domain: Type, codomain: Type, name: ?string): Type`

Returns a type representing the nullable type `?type`.

## `assert.maybe(type: Type, name: ?string): Type`

Returns a type representing the nullable type `?type`.

## `assert.union(types: Array<Type>, name: ?string): Type`

Returns a type representing the union `T1 | T2 | ... | Tn`.

## `assert.intersection(types: Array<Type>, name: ?string): Type`

Returns a type representing the intersection `T1 & T2 & ... & Tn`.

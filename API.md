# API

## Assert library

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

`transform(source: string, options: ?object): string`

Options:

- `namespace`: string (default `f`)
- `sourceMap`: boolean (default `false`)
- `target`: string (one of ["es3"])

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

`f.shape(props: {[key:string]: Type}): Type`

Returns a type representing the object `{p1: T1, p2: T2, ... p3: T3}`.

`f.dict(domain: Type, codomain: Type, name: ?string): Type`

Returns a type representing the dictionary type `{[key: domain]: codomain}`.

`f.maybe(type: Type, name: ?string): Type`

Returns a type representing the nullable type `?type`.

`f.union(types: Array<Type>, name: ?string): Type`

Returns a type representing the union `T1 | T2 | ... | Tn`.

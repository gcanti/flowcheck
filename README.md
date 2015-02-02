# Why?

Use types annotations today, even if you don't actually use Flow (or TypeScript). Then strip the assertions in production.

Flowcheck comes with a built-in browserify transformer and supports sourcemaps for a seamless workflow integration.

You can even use Flowcheck as a general purpose validation library.

# How it works?

Flowcheck adds asserts for each type annotation using jstransform.

If an assert fails the debugger kicks in so you can inspect the stack and quickly find out what's wrong.

# Demo live

[https://gcanti.github.io/flowcheck](https://gcanti.github.io/flowcheck)

# Workflow

1. Write your code adding type annotations
2. (optional) enable the Flow static type checker
3. enable Flowcheck.js and strip type annotations (with react-tools or 6to5) during development
4. disable Flowcheck.js in production for zero overhead

# Differences with flow

- Flowcheck tuples are fixed-length arrays [#227](https://github.com/facebook/flow/issues/227)
- polymorphic types **are erased**
- supports optional properties in objects (using `void` type) [#38](https://github.com/facebook/flow/issues/38)

# Modules

- a **source transformer** (transform.js)
- a **browserify transformer** (index.js)
- a **runtime assertion library** (assert.js)

The transformer adds assertions for each type annotation.

The assertion module checks the types at runtime. If an assert fails **the debugger kicks in** so you can inspect the stack and quickly find out what's wrong.

# Plugins

There is [flowcheck-loader](https://github.com/gaearon/flowcheck-loader) for Webpack which is equivalent to Flowcheck's Browserify transform.

# Tests

```js
npm test
```

# License

MIT

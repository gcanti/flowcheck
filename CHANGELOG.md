# Changelog

> **Tags:**
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]

**Note**: Gaps between patch versions are faulty/broken releases.

## v0.2.4

- **Bug Fix**
  + Removed CRLF from `visitProgram` causing wrong bad sourceMaps
- **Internal**
  + Upgrade to latest babelify

## v0.2.3

- **Internal**
  + It shouldn't die if requiring JSON, fix #12

## v0.2.1

- **Internal**
  + Changed the default namespace from `f` to `_f` to avoid likely name conflicts
  + Added a `visitProgram` to `visitor.js`. It adds `var _f = require("flowcheck/assert");` at the beginning of the file, fix #4
  + Added to `visitProgram` a `namespace.indexOf('require') === -1` check in order to not break flowcheck-loader (temporary)
- **New Feature**
  + Added a boolean option `skipImport` (default `false`). If set to `true`, skips the `visitProgram` visitor (useful for tests or if you want to import by hand the module flowcheck/assert as a global)

## v0.2

- **Polish**
  + Code refactoring
- **Internal**
  + Added more tests

## v0.1

- First release

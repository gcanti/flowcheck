v0.2.3 2015-02-06

- it shouldn't die if requiring JSON, fix #12

v0.2.1 2015-01-23

- changed the default namespace from `f` to `_f` to avoid likely name conflicts
- added a `visitProgram` to `visitor.js`. It adds `var _f = require("flowcheck/assert");` at the beginning of the file, fix #4
- added a boolean option `skipImport` (default `false`). If set to `true`, skips the `visitProgram` visitor (useful for tests or if you want to import by hand the module flowcheck/assert as a global)
- added to `visitProgram` a `namespace.indexOf('require') === -1` check in order to not break flowcheck-loader (temporary)

v0.2 2015-01-21

- polished code
- added more tests

v0.1 2015-01-20

- first release

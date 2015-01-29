(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.f = factory();
  }
}(this, function () {

  'use strict';

  function Failure(actual, expected, ctx) {
    this.actual = actual;
    this.expected = expected;
    this.ctx = ctx;
  }

  Failure.prototype.toString = function () {
    var ctx = this.ctx ? this.ctx.join(' / ') : '';
    ctx = ctx ? ', context: ' + ctx : ', (no context)';
    return 'Expected an instance of ' + this.expected.name +
    ' got ' + JSON.stringify(this.actual) + ctx;
  };

  function Type(name, validate, is) {
    this.name = name;
    this.validate = validate;
    if (is) { this.is = is; }
  }

  Type.prototype.is = function (x) {
    return this.validate(x, null, true) === null;
  };

  function define(name, is) {
    var type = new Type(name, function (x, ctx) {
      return is(x) ? null : [new Failure(x, type, ctx)];
    }, is);
    return type;
  }

  var Any = define('any', function () {
    return true;
  });

  var Mixed = define('mixed', function () {
    return true;
  });

  var Void = define('void', function (x) {
    return x === void 0;
  });

  var Str = define('string', function (x) {
    return typeof x === 'string';
  });

  var Num = define('number', function (x) {
    return typeof x === 'number';
  });

  var Bool = define('boolean', function (x) {
    return x === true || x === false;
  });

  var Arr = define('array', function (x) {
    return x instanceof Array;
  });

  var Obj = define('object', function (x) {
    return x != null && typeof x === 'object' && !Arr.is(x);
  });

  var Func = define('function', function (x) {
    return typeof x === 'function';
  });

  function validate(x, type, ctx, fast) {
    if (type.validate) { return type.validate(x, ctx, fast); }
    return x instanceof type ? null : [new Failure(x, type, ctx)];
  }

  function list(type, name) {
    name = name || 'Array<' + type.name + '>';
    return new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      ctx.push(name);
      // if x is not an array, fail fast
      if (!Arr.is(x)) { return [new Failure(x, Arr, ctx)]; }
      var errors = null, suberrors;
      for (var i = 0, len = x.length ; i < len ; i++ ) {
        suberrors = validate(x[i], type, ctx.concat(i));
        if (suberrors) {
          if (fast) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
      return errors;
    });
  }

  function optional(type, name) {
    name = name || type.name + '?';
    return new Type(name, function (x, ctx, fast) {
      if (x === void 0) { return null; }
      ctx = ctx || [];
      ctx.push(name);
      return validate(x, type, ctx, fast);
    });
  }

  function maybe(type, name) {
    name = name || '?' + type.name;
    return new Type(name, function (x, ctx, fast) {
      if (x === null) { return null; }
      ctx = ctx || [];
      ctx.push(name);
      return validate(x, type, ctx, fast);
    });
  }

  function getName(type) {
    return type.name;
  }

  function tuple(types, name) {
    name = name || '[' + types.map(getName).join(', ') + ']';
    var dimension = types.length;
    var type = new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      // if x is not an array, fail fast
      if (!Arr.is(x)) { return [new Failure(x, Arr, ctx.concat(name))]; }
      // if x has a wrong length, fail fast
      if (x.length !== dimension) { return [new Failure(x, type, ctx)]; }
      var errors = null, suberrors;
      for (var i = 0 ; i < dimension ; i++ ) {
        suberrors = validate(x[i], types[i], ctx.concat(name, i));
        if (suberrors) {
          if (fast) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
      return errors;
    });
    return type;
  }

  function dict(domain, codomain, name) {
    name = name || '{[key: ' + domain.name + ']: ' + codomain.name + '}';
    return new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      // if x is not an object, fail fast
      if (!Obj.is(x)) { return [new Failure(x, Obj, ctx.concat(name))]; }
      var errors = null, suberrors;
      for (var k in x) {
        if (x.hasOwnProperty(k)) {
          // check domain
          suberrors = validate(k, domain, ctx.concat(name, k));
          if (suberrors) {
            if (fast) { return suberrors; }
            errors = errors || [];
            errors.push.apply(errors, suberrors);
          }
          // check codomain
          suberrors = validate(x[k], codomain, ctx.concat(name, k));
          if (suberrors) {
            if (fast) { return suberrors; }
            errors = errors || [];
            errors.push.apply(errors, suberrors);
          }
        }
      }
      return errors;
    });
  }

  function shape(props, name) {
    name = name || '{' + Object.keys(props).map(function (k) { return k + ': ' + props[k].name + ';'; }).join(' ') + '}';
    return new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      // if x is not an object, fail fast
      if (!Obj.is(x)) { return [new Failure(x, Obj, ctx.concat(name))]; }
      var errors = null, suberrors;
      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          suberrors = validate(x[k], props[k], ctx.concat(name, k));
          if (suberrors) {
            if (fast) { return suberrors; }
            errors = errors || [];
            errors.push.apply(errors, suberrors);
          }
        }
      }
      return errors;
    });
  }

  function union(types, name) {
    name = name || types.map(getName).join(' | ');
    var type = new Type(name, function (x, ctx) {
      if (types.some(function (type) {
        return type.is(x);
      })) { return null; }
      ctx = ctx || [];
      return [new Failure(x, type, ctx.concat(name))];
    });
    return type;
  }

  function slice(arr, start, end) {
    return Array.prototype.slice.call(arr, start, end);
  }

  function args(types, varargs) {
    var name = '(' + types.map(getName).join(', ') + ', ...' + (varargs || Any).name + ')';
    var len = types.length;
    var typesTuple = tuple(types);
    if (varargs) { varargs = list(varargs); }
    return new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      var args = x;
      // test if args is an array-like structure
      if (args.hasOwnProperty('length')) {
        args = slice(args, 0, len);
        // handle optional arguments filling the array with undefined values
        if (args.length < len) { args.length = len; }
      }
      var errors = null, suberrors;
      suberrors = typesTuple.validate(args, ctx.concat('arguments'), fast);
      if (suberrors) {
        if (fast) { return suberrors; }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
      if (varargs) {
        suberrors = varargs.validate(slice(x, len), ctx.concat('varargs'), fast);
        if (suberrors) {
          if (fast) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
      return errors;
    });
  }

  function check(x, type) {
    var errors = validate(x, type);
    if (errors) {
      var message = [].concat(errors).join('\n');
      debugger;
      throw new TypeError(message);
    }
    return x;
  }

  var exports = {
    Type: Type,
    define: define,
    any: Any,
    mixed: Mixed,
    'void': Void,
    number: Num,
    string: Str,
    'boolean': Bool,
    object: Obj,
    'function': Func,
    list: list,
    optional: optional,
    maybe: maybe,
    tuple: tuple,
    dict: dict,
    shape: shape,
    union: union,
    arguments: args,
    check: check
  };

  return exports;

}));

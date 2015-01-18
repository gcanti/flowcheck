(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.dike = factory();
  }
}(this, function () {

  'use strict';

  /*

    A set / type is an object with a static function:

        validate(x: any, ctx: ?Array<any>, fast: ?boolean): Validation

  */

  function Failure(actual, expected, ctx) {
    this.actual = actual;
    this.expected = expected;
    this.ctx = ctx;
  }

  Failure.prototype.toString = function () {
    return 'Expected an instance of ' + this.expected.name +
    (this.ctx ? ' in ' + this.ctx.join('.') : '') +
    ', got `' + JSON.stringify(this.actual) + '`';
  };

  function Type(name, validate, is) {
    this.name = name;
    this.validate = validate;
    if (is) { this.is = is; }
  }

  Type.prototype.is = function (x) {
    return this.validate(x, null, true).ok;
  };

  function irreducible(name, is) {
    var type = new Type(name, function (x, ctx) {
      return is(x) ? null : [new Failure(x, type, ctx)];
    }, is);
    return type;
  }

  var Any = irreducible('any', function () {
    return true;
  });

  var Mixed = irreducible('mixed', function () {
    return true;
  });

  var Void = irreducible('void', function (x) {
    return x === void 0;
  });

  var Str = irreducible('string', function (x) {
    return typeof x === 'string';
  });

  var Num = irreducible('number', function (x) {
    return typeof x === 'number' && isFinite(x) && !isNaN(x);
  });

  var Bool = irreducible('boolean', function (x) {
    return x === true || x === false;
  });

  var Arr = irreducible('array', function (x) {
    return x instanceof Array;
  });

  var Obj = irreducible('object', function (x) {
    return x != null && typeof x === 'object' && !Arr.is(x);
  });

  function validate(x, T, ctx, fast) {
    if (T.validate) { return T.validate(x, ctx, fast); }
    return x instanceof T ? null : [new Failure(x, T, ctx)];
  }

  function list(T, name) {
    name = name || 'Array<' + T.name + '>';
    return new Type(name, function (x, ctx, fast) {
      ctx = ctx || [];
      ctx.push(name);
      // if x is not an array, fail fast
      if (!Arr.is(x)) { return [new Failure(x, Arr, ctx)]; }
      var errors = null, suberrors;
      for (var i = 0, len = x.length ; i < len ; i++ ) {
        suberrors = validate(x[i], T, ctx.concat(i));
        if (suberrors) {
          errors = errors || [];
          errors.push.apply(errors, suberrors);
          if (fast) { break; }
        }
      }
      return errors;
    });
  }

  function maybe(T, name) {
    name = name || '?' + T.name;
    return new Type(name, function (x, ctx, fast) {
      if (x === null) { return null; }
      return validate(x, T, ctx, fast);
    });
  }

  function getName(T) {
    return T.name;
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
          errors = errors || [];
          errors.push.apply(errors, suberrors);
          if (fast) { break; }
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
            errors = errors || [];
            errors.push.apply(errors, suberrors);
            if (fast) { break; }
          }
          // check codomain
          suberrors = validate(x[k], codomain, ctx.concat(name, k));
          if (suberrors) {
            errors = errors || [];
            errors.push.apply(errors, suberrors);
            if (fast) { break; }
          }
        }
      }
      return errors;
    });
  }

  function object(props, name) {
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
            errors = errors || [];
            errors.push.apply(errors, suberrors);
            if (fast) { break; }
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

  function check(x, T) {
    var errors = validate(x, T);
    if (errors) {
      var message = [].concat(errors).join('\n');
      //debugger;
      throw new TypeError(message);
    }
    return x;
  }

  var exports = {
    any: Any,
    mixed: Mixed,
    'void': Void,
    number: Num,
    string: Str,
    'boolean': Bool,
    list: list,
    maybe: maybe,
    tuple: tuple,
    dict: dict,
    object: object,
    union: union,
    validate: validate
  };

  return exports;

}));

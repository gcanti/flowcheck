//     flowcheck 0.2.7
//     https://github.com/gcanti/flowcheck
//     (c) 2015 Giulio Canti <giulio.canti@gmail.com>
//     flowcheck may be freely distributed under the MIT license.
//     (checked with Flow and transpiled with jsx)
/* @flow */
'use strict';
function getFunctionName(f) {
  return f.displayName || f.name || ("<function" + f.length + ">");
}
function Failure(actual, expected, ctx) {
  this.actual = actual;
  this.expected = expected;
  this.ctx = ctx;
}
Failure.prototype.toString = function () {
  var ctx = this.ctx ? this.ctx.join(' / ') : '';
  ctx = ctx ? (", context: " + ctx) : ', (no context)';
  return ("Expected an instance of " + this.expected.name + " got " + (Failure.stringify(this.actual) + ctx));
};
Failure.stringify = function (x) {
  try { // handle circular references
    return JSON.stringify(x, function (k, v) {
      if (typeof v === 'function') {
        return ("[" + getFunctionName(v) + ", Function]");
      } // handle functions
      if (v instanceof RegExp) {
        return ("[" + String(v) + ", RegExp]");
      } // handle regexps
      return v;
    }, 2);
  } catch (e) {}
  return String(x);
};
function Type(name, validate) {
  this.name = name;
  this.validate = validate;
}
Type.prototype.is = function (x) {
  return this.validate(x, null, true) === null;
};
function define(name, is) {
  var type = new Type(name, function (x, ctx) {
    return is(x) ? null : [new Failure(x, type, ctx)];
  });
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
  return x !== null && x !== undefined && typeof x === 'object' && !Arr.is(x);
});
var Func = define('function', function (x) {
  return typeof x === 'function';
});
function validate(x, type, ctx, failOnFirstError) {
  if (type.validate) {
    return type.validate(x, ctx, failOnFirstError);
  }
  return x instanceof type ? null : [new Failure(x, type, ctx)];
}
function list(type, name) {
  name = name || ("Array<" + type.name + ">");
  return new Type(name, function (x, ctx, failOnFirstError) {
    ctx = ctx || [];
    ctx.push(name);
    // if x is not an array, fail fast
    if (!Arr.is(x)) {
      return [new Failure(x, Arr, ctx)];
    }
    var errors = null,
        suberrors;
    for (var i = 0, len = x.length; i < len; i++) {
      suberrors = validate(x[i], type, ctx.concat(i));
      if (suberrors) {
        if (failOnFirstError) {
          return suberrors;
        }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
    }
    return errors;
  });
}
function optional(type, name) {
  name = name || (type.name + "?");
  return new Type(name, function (x, ctx, failOnFirstError) {
    if (x === void 0) {
      return null;
    }
    ctx = ctx || [];
    ctx.push(name);
    return validate(x, type, ctx, failOnFirstError);
  });
}
function maybe(type, name) {
  name = name || ("?" + type.name);
  return new Type(name, function (x, ctx, failOnFirstError) {
    if (x === null) {
      return null;
    }
    ctx = ctx || [];
    ctx.push(name);
    return validate(x, type, ctx, failOnFirstError);
  });
}
function getName(type) {
  return type.name;
}
function tuple(types, name) {
  name = name || ("[" + types.map(getName).join(', ') + "]");
  var dimension = types.length;
  var type = new Type(name, function (x, ctx, failOnFirstError) {
    ctx = ctx || [];
    // if x is not an array, fail fast
    if (!Arr.is(x)) {
      return [new Failure(x, Arr, ctx.concat(name))];
    }
    // if x has a wrong length, fail failOnFirstError
    if (x.length !== dimension) {
      return [new Failure(x, type, ctx)];
    }
    var errors = null,
        suberrors;
    for (var i = 0; i < dimension; i++) {
      suberrors = validate(x[i], types[i], ctx.concat(name, i));
      if (suberrors) {
        if (failOnFirstError) {
          return suberrors;
        }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
    }
    return errors;
  });
  return type;
}
function dict(domain, codomain, name) {
  name = name || ("{[key: " + domain.name + "]: " + codomain.name + "}");
  return new Type(name, function (x, ctx, failOnFirstError) {
    ctx = ctx || [];
    // if x is not an object, fail fast
    if (!Obj.is(x)) {
      return [new Failure(x, Obj, ctx.concat(name))];
    }
    var errors = null,
        suberrors;
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        // check domain
        suberrors = validate(k, domain, ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) {
            return suberrors;
          }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
        // check codomain
        suberrors = validate(x[k], codomain, ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) {
            return suberrors;
          }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
    }
    return errors;
  });
}
function shape(props, name) {
  name = name || ("{" + Object.keys(props).map(function (k) {
    return k + ': ' + props[k].name + ';';
  }).join(' ') + "}");
  return new Type(name, function (x, ctx, failOnFirstError) {
    ctx = ctx || [];
    // if x is not an object, fail fast
    if (!Obj.is(x)) {
      return [new Failure(x, Obj, ctx.concat(name))];
    }
    var errors = null,
        suberrors;
    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        suberrors = validate(x[k], props[k], ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) {
            return suberrors;
          }
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
    ctx = (ctx || []).concat(name);
    if (types.some(function (type) {
      return validate(x, type, ctx, true) === null;
    })) {
      return null;
    }
    return [new Failure(x, type, ctx)];
  });
  return type;
}
function slice(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
}
function args(types, varargs) {
  var name = ("(" + types.map(getName).join(', ') + ", ..." + (varargs || Any).name + ")");
  var length = types.length;
  var typesTuple = tuple(types);
  if (varargs) {
    varargs = list(varargs);
  }
  return new Type(name, function (x, ctx, failOnFirstError) {
    ctx = ctx || [];
    var args = x;
    // test if args is an array-like structure
    if (args.hasOwnProperty('length')) {
      args = slice(args, 0, length);
      // handle optional arguments filling the array with undefined values
      if (args.length < length) {
        args.length = length;
      }
    }
    var errors = null,
        suberrors;
    suberrors = typesTuple.validate(args, ctx.concat('arguments'), failOnFirstError);
    if (suberrors) {
      if (failOnFirstError) {
        return suberrors;
      }
      errors = errors || [];
      errors.push.apply(errors, suberrors);
    }
    if (varargs) {
      suberrors = varargs.validate(slice(x, length), ctx.concat('varargs'), failOnFirstError);
      if (suberrors) {
        if (failOnFirstError) {
          return suberrors;
        }
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
    throw new TypeError(message);
  }
  return x;
}
module.exports = {
  Failure: Failure,
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
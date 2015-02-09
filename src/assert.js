/* @flow */

'use strict';

function getFunctionName (f: any): string {
  return f.displayName || f.name || `<function${f.length}>`;
}

class Failure {

  actual: any;
  expected: Type;
  ctx: ?ValidationContext;

  constructor(actual: any, expected: Type, ctx?: ?ValidationContext) {
    this.actual = actual;
    this.expected = expected;
    this.ctx = ctx;
  }

  toString(): string {
    var ctx = this.ctx ? this.ctx.join(' / ') : '';
    ctx = ctx ? `, context: ${ctx}` : ', (no context)';
    return `Expected an instance of ${this.expected.name} got ${Failure.stringify(this.actual) + ctx}`;
  }

  static stringify(x: any): string {
    try { // handle circular references
      return JSON.stringify(x, (k, v) => {
        if (typeof v === 'function') { return `[${getFunctionName(v)}, Function]`; } // handle functions
        if (v instanceof RegExp) { return `[${String(v)}, RegExp]`; } // handle regexps
        return v;
      });
    } catch (e) {
      return String(x);
    }
  }

}

type ValidationContext = Array<string | number>;
type ValidationFunction = (x: any, ctx?: ?ValidationContext, failOnFirstError?: boolean) => ?Array<Failure>;
type Predicate = (x: any) => boolean;

class Type {

  name: string;
  validate: ValidationFunction;

  constructor(name: string, validate: ValidationFunction) {
    this.name = name;
    this.validate = validate;
  }

  is(x: any): boolean {
    return this.validate(x, null, true) === null;
  }

}

function define(name: string, is: Predicate): Type {
  var type: Type = new Type(name, (x, ctx) => {
    return is(x) ? null : [new Failure(x, type, ctx)];
  });
  return type;
}

var Any = define('any', () => true);

var Mixed = define('mixed', () => true);

var Void = define('void', (x) => x === void 0);

var Str = define('string', (x) => typeof x === 'string');

var Num = define('number', (x) => typeof x === 'number');

var Bool = define('boolean', (x) => x === true || x === false);

var Arr = define('array', (x) => x instanceof Array);

var Obj = define('object', (x) => x !== null && x !== undefined && typeof x === 'object' && !Arr.is(x));

var Func = define('function', (x) => typeof x === 'function');

function validate(x: any, type: any, ctx?: ?ValidationContext, failOnFirstError?: boolean) {
  if (type.validate) {
    return type.validate(x, ctx, failOnFirstError);
  }
  return x instanceof type ? null : [new Failure(x, type, ctx)];
}

function list(type: Type, name?: string): Type {
  name = name || `Array<${type.name}>`;
  return new Type(name, (x, ctx, failOnFirstError) => {
    ctx = ctx || [];
    ctx.push(name);
    // if x is not an array, fail fast
    if (!Arr.is(x)) { return [new Failure(x, Arr, ctx)]; }
    var errors: ?Array<Failure> = null, suberrors: ?Array<Failure>;
    for (var i = 0, len = x.length ; i < len ; i++ ) {
      suberrors = validate(x[i], type, ctx.concat(i));
      if (suberrors) {
        if (failOnFirstError) { return suberrors; }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
    }
    return errors;
  });
}

function optional(type: Type, name?: string): Type {
  name = name || `${type.name}?`;
  return new Type(name, (x, ctx, failOnFirstError) => {
    if (x === void 0) { return null; }
    ctx = ctx || [];
    ctx.push(name);
    return validate(x, type, ctx, failOnFirstError);
  });
}

function maybe(type: Type, name?: string): Type {
  name = name || `?${type.name}`;
  return new Type(name, (x, ctx, failOnFirstError) => {
    if (x === null) { return null; }
    ctx = ctx || [];
    ctx.push(name);
    return validate(x, type, ctx, failOnFirstError);
  });
}

function getName(type: Type): string {
  return type.name;
}

function tuple(types: Array<Type>, name?: string): Type {
  name = name || `[${types.map(getName).join(', ')}]`;
  var dimension = types.length;
  var type: Type = new Type(name, (x, ctx, failOnFirstError) => {
    ctx = ctx || [];
    // if x is not an array, fail fast
    if (!Arr.is(x)) { return [new Failure(x, Arr, ctx.concat(name))]; }
    // if x has a wrong length, fail failOnFirstError
    if (x.length !== dimension) { return [new Failure(x, type, ctx)]; }
    var errors: ?Array<Failure> = null, suberrors: ?Array<Failure>;
    for (var i = 0 ; i < dimension ; i++ ) {
      suberrors = validate(x[i], types[i], ctx.concat(name, i));
      if (suberrors) {
        if (failOnFirstError) { return suberrors; }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
    }
    return errors;
  });
  return type;
}

function dict(domain: Type, codomain: Type, name?: string): Type {
  name = name || `{[key: ${domain.name}]: ${codomain.name}}`;
  return new Type(name, (x, ctx, failOnFirstError) => {
    ctx = ctx || [];
    // if x is not an object, fail fast
    if (!Obj.is(x)) { return [new Failure(x, Obj, ctx.concat(name))]; }
    var errors: ?Array<Failure> = null, suberrors: ?Array<Failure>;
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        // check domain
        suberrors = validate(k, domain, ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
        // check codomain
        suberrors = validate(x[k], codomain, ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
    }
    return errors;
  });
}

function shape(props: {[key: string]: Type;}, name?: string): Type {
  name = name || `{${Object.keys(props).map(function (k) { return k + ': ' + props[k].name + ';';}).join(' ')}}`;
  return new Type(name, (x, ctx, failOnFirstError) => {
    ctx = ctx || [];
    // if x is not an object, fail fast
    if (!Obj.is(x)) { return [new Failure(x, Obj, ctx.concat(name))]; }
    var errors: ?Array<Failure> = null, suberrors: ?Array<Failure>;
    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        suberrors = validate(x[k], props[k], ctx.concat(name, k));
        if (suberrors) {
          if (failOnFirstError) { return suberrors; }
          errors = errors || [];
          errors.push.apply(errors, suberrors);
        }
      }
    }
    return errors;
  });
}

function union(types: Array<Type>, name?: string): Type {
  name = name || types.map(getName).join(' | ');
  var type: Type = new Type(name, (x, ctx) => {
    if (types.some(function (type) {
      return type.is(x);
    })) { return null; }
    ctx = ctx || [];
    return [new Failure(x, type, ctx.concat(name))];
  });
  return type;
}

function slice<T>(arr: Array<T>, start?: number, end?: number): Array<T> {
  return Array.prototype.slice.call(arr, start, end);
}

function args(types: Array<Type>, varargs?: Type): Type {
  var name = `(${types.map(getName).join(', ')}, ...${(varargs || Any).name})`;
  var len = types.length;
  var typesTuple = tuple(types);
  if (varargs) { varargs = list(varargs); }
  return new Type(name, (x, ctx, failOnFirstError) => {
    ctx = ctx || [];
    var args = x;
    // test if args is an array-like structure
    if (args.hasOwnProperty('length')) {
      args = slice(args, 0, len);
      // handle optional arguments filling the array with undefined values
      if (args.length < len) { args.length = len; }
    }
    var errors: ?Array<Failure> = null, suberrors: ?Array<Failure>;
    suberrors = typesTuple.validate(args, ctx.concat('arguments'), failOnFirstError);
    if (suberrors) {
      if (failOnFirstError) { return suberrors; }
      errors = errors || [];
      errors.push.apply(errors, suberrors);
    }
    if (varargs) {
      suberrors = varargs.validate(slice(x, len), ctx.concat('varargs'), failOnFirstError);
      if (suberrors) {
        if (failOnFirstError) { return suberrors; }
        errors = errors || [];
        errors.push.apply(errors, suberrors);
      }
    }
    return errors;
  });
}

var failed = false;

function check<T>(x: T, type: Type): T {
  var errors = validate(x, type);
  if (errors) {
    var message = [].concat(errors).join('\n');
    if (!failed) { // start the debugger only once
      /*jshint debug: true*/
      debugger;
    }
    failed = true;
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

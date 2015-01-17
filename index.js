'use strict';

/*

  A set / type is an object with a static function validate(x: any, ctx: ?Array<any>, fast: ?boolean): Validation

*/

function Failure(actual, expected, ctx) {
  this.actual = actual;
  this.expected = expected;
  this.ctx = ctx;
}

Failure.prototype.toString = function () {
  return 'Expected an instance of `' + this.expected.name + '` for `' + (this.ctx || ['value']).join('.') + '`, got `' + JSON.stringify(this.actual) + '`';
};

function Validation(value, errors) {
  this.value = value;
  this.errors = errors;
  this.ok = !errors || errors.length === 0;
}

Validation.prototype.toString = function () {
  return this.ok ? 'ok' : this.errors.join('\n');
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
    return is(x) ? new Validation(x) : new Validation(x, [new Failure(x, type, ctx)]);
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
  return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
});

function validate(x, T, ctx, fast) {
  if (T.validate) { return T.validate(x, ctx, fast); }
  return x instanceof T ? new Validation(x) : new Validation(x, [new Failure(x, T, ctx)]);
}

function list(T, name) {
  name = name || 'Array<' + T.name + '>';
  return new Type(name, function (x, ctx, fast) {
    ctx = ctx || [];
    ctx.push(name);
    if (!Arr.is(x)) { return new Validation(x, [new Failure(x, Arr, ctx)]); }
    var value = [], errors = [], v;
    for (var i = 0, len = x.length ; i < len ; i++ ) {
      v = validate(x[i], T, ctx.concat(i));
      value[i] = v.value;
      if (!v.ok) {
        errors.push.apply(errors, v.errors);
        if (fast) { break; }
      }
    }
    return new Validation(value, errors);
  });
}

function maybe(T, name) {
  name = name || '?' + T.name;
  return new Type(name, function (x, ctx, fast) {
    if (x === null) { return new Validation(x); }
    return validate(x, T, ctx, fast);
  });
}

function getName(T) {
  return T.name;
}

function tuple(types, name) {
  name = name || '[' + types.map(getName).join(', ') + ']';
  var len = types.length;
  return new Type(name, function (x, ctx, fast) {
    ctx = ctx || [];
    ctx.push(name);
    if (!Arr.is(x)) { return new Validation(x, [new Failure(x, Arr, ctx)]); }
    var value = [], errors = [], v;
    for (var i = 0 ; i < len ; i++ ) {
      v = validate(x[i], types[i], ctx.concat(i));
      value[i] = v.value;
      if (!v.ok) {
        errors.push.apply(errors, v.errors);
        if (fast) { break; }
      }
    }
    return new Validation(value, errors);
  });
}

function type(x, T) {
  var v = validate(x, T);
  if (!v.ok) {
    var message = v + '';
    //debugger;
    throw new TypeError(message);
  }
  return x;
}


'use strict';

var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;

//
// utils
//

function debug(x) {
  console.log(JSON.stringify(x, null, 2));
}

function getName(x) {
  return x.name;
}

function getObjectKey(key) {
  switch (key.type) {
    case Syntax.Identifier :
      return key.name;
    case Syntax.Literal :
      return JSON.stringify(key.value);
  }
}

function toLookup(arr) {
  var lookup = {};
  for (var i = 0, len = arr.length ; i < len ; i++ ) {
    lookup[arr[i]] = true;
  }
  return lookup;
}

function Context(state, blacklist) {
  this.state = state;
  this.blacklist = blacklist;
  this.namespace = state.g.opts.namespace;
  this.target = state.g.opts.target;
}

Context.prototype.getProperty = function(name) {
  return this.target === 'es3' && name in {'void': 1, 'boolean': 1} ? // compatibility with ES3
    this.namespace + '["' + name + '"]' :
    this.namespace + '.' + name;
};

Context.prototype.getNodeText = function(node) {
  return utils.getNodeSourceText(node, this.state) +
  ', line: ' + node.loc.start.line +
  ', column: ' + node.loc.start.column;
};

Context.prototype.getType = function(ann) {
  if (ann) {
    switch (ann.type) {
      case Syntax.StringTypeAnnotation :
        return this.getProperty('string');
      case Syntax.NumberTypeAnnotation :
        return this.getProperty('number');
      case Syntax.BooleanTypeAnnotation :
        return this.getProperty('boolean');
      case Syntax.AnyTypeAnnotation :
        return this.getProperty('any');
      case Syntax.VoidTypeAnnotation :
        return this.getProperty('void');

      case Syntax.NullableTypeAnnotation :
        // handle `?T`
        return this.getProperty('maybe') + '(' + this.getType(ann.typeAnnotation) + ')';

      case Syntax.ArrayTypeAnnotation :
        // handle `T[]`
        return this.getProperty('list') + '(' + this.getType(ann.elementType) + ')';

      case Syntax.GenericTypeAnnotation :
        if (ann.id.type === Syntax.Identifier) {
          var name = ann.id.name;
          // handle `mixed` type
          if (name === 'mixed') {
            return this.getProperty('mixed');
          }
          // handle `Object` type
          if (name === 'Object') {
            return this.getProperty('object');
          }
          // handle `Function` type
          if (name === 'Function') {
            return this.getProperty('function');
          }
          if (name === 'Array') {
            // handle `Array`
            if (!ann.typeParameters) {
              return this.getProperty('list') + '(' + this.getProperty('any') + ')';
            }
            // handle `Array<T>`
            var atp = ann.typeParameters.params;
            if (atp.length !== 1) {
              throw new Error('invalid Array declaration ' + this.getNodeText(ann) + ' expected only one type parameter');
            }
            return this.getProperty('list') + '(' + this.getType(atp[0]) + ')';
          }
          // handle generics e.g. `function foo<T>(x: T) { return x; }`
          // must print `f.arguments([f.any])` not `f.arguments([T])`
          if (!this.blacklist || !this.blacklist.hasOwnProperty(name)) {
            return name;
          }
        }
        break;

      case Syntax.TupleTypeAnnotation :
        // handle `[T1, T2, ... , Tn]`
        return this.getProperty('tuple') + '([' + ann.types.map(function (type) {
          return this.getType(type);
        }.bind(this)).join(', ') + '])';

      case Syntax.ObjectTypeAnnotation :
        if (ann.properties.length) {
          // handle `{p1: T1; p2: T2; ... pn: Tn;}`
          return this.getProperty('shape') + '({' + ann.properties.map(function (prop) {
            return getObjectKey(prop.key) + ': ' + this.getType(prop.value);
          }.bind(this)).join(', ') + '})';
        }
        // handle `{[key: D]: C}`
        var domain = this.getType(ann.indexers[0].key);
        var codomain = this.getType(ann.indexers[0].value);
        return this.getProperty('dict') + '(' + domain + ', ' + codomain + ')';

      case Syntax.UnionTypeAnnotation :
        // handle `T1 | T2 | ... | Tn`
        return this.getProperty('union') + '([' + ann.types.map(function (type) {
          return this.getType(type);
        }.bind(this)).join(', ') + '])';

      case Syntax.FunctionTypeAnnotation :
        // handle `(x: T) => U`
        return this.getProperty('function');

    }
  }
  // fallback
  return this.getProperty('any');
};

//
// visitors
//

function visitTypedVariableDeclarator(traverse, node, path, state) {
  var ctx = new Context(state);
  if (node.init) {
    utils.catchup(node.init.range[0], state);
    utils.append(ctx.getProperty('check') + '(', state);
    traverse(node.init, path, state);
    utils.catchup(node.init.range[1], state);
    utils.append(', ' + ctx.getType(node.id.typeAnnotation.typeAnnotation) + ')', state);
  }
  utils.catchup(node.range[1], state);
  return false;
}
visitTypedVariableDeclarator.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator &&
    node.id.typeAnnotation;
};

function visitTypedFunction(traverse, node, path, state) {
  var blacklist = node.typeParameters ? toLookup(node.typeParameters.params.map(getName)) : null;
  var ctx = new Context(state, blacklist);
  var rest = node.rest ? ', ' + ctx.getType(node.rest.typeAnnotation.typeAnnotation) : '';
  var types = [];
  var params = [];
  node.params.forEach(function (param) {
    var type = ctx.getType(param.typeAnnotation ? param.typeAnnotation.typeAnnotation : null);
    types.push(param.optional ? ctx.getProperty('optional') + '(' + type + ')' : type);
    params.push(param.name);
  });

  utils.catchup(node.body.range[0] + 1, state);

  if (params.length || rest) {
    utils.append(ctx.getProperty('check') + '(arguments, ' + ctx.getProperty('arguments') + '([' + types.join(', ') + ']' + rest + '));', state);
  }

  if (node.returnType) {
    var returnType = ctx.getType(node.returnType.typeAnnotation);
    utils.append(' var ret = (function (' + params.join(', ') + ') {', state);
    utils.catchup(node.body.range[1], state);
    utils.append(').apply(this, arguments); return ' + ctx.getProperty('check') + '(ret, ' + returnType + ');}', state);
  }

  utils.catchup(node.range[1], state);
  return false;
}
visitTypedFunction.test = function(node, path, state) {
  return (node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression) &&
  (
    node.returnType ||
    (node.rest && node.rest.typeAnnotation) ||
    node.params.some(function (param) { return !!param.typeAnnotation; })
  );
};

function visitTypeAlias(traverse, node, path, state) {
  var ctx = new Context(state);
  utils.catchup(node.range[1], state);
  utils.append('var ' + node.id.name + ' = ' + ctx.getType(node.right) + ';', state);
  return false;
}
visitTypeAlias.test = function (node, path, state) {
  return node.type === Syntax.TypeAlias;
};

module.exports = {
  visitorList: [
    visitTypedFunction,
    visitTypedVariableDeclarator,
    visitTypeAlias
  ]
};

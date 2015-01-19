'use strict';

var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;
//console.log(Syntax);

//
// utils
//

function debug(x) {
  console.log(JSON.stringify(x, null, 2));
}

function getOption(name, state) {
  return state.g.opts[name];
}

function getProperty(name, ns) {
  return name in {'void': 1, 'boolean': 1} ? // compatibility with ES3
    ns + '["' + name + '"]' :
    ns + '.' + name;
}

function getType(ann, ns) {
  if (ann) {
    switch (ann.type) {

      case Syntax.StringTypeAnnotation :
        return getProperty('string', ns);
      case Syntax.NumberTypeAnnotation :
        return getProperty('number', ns);
      case Syntax.BooleanTypeAnnotation :
        return getProperty('boolean', ns);
      case Syntax.AnyTypeAnnotation :
        return getProperty('any', ns);
      case Syntax.VoidTypeAnnotation :
        return getProperty('void', ns);

      case Syntax.NullableTypeAnnotation :
        // handle ?T
        return getProperty('maybe', ns) + '(' + getType(ann.typeAnnotation, ns) + ')';

      case Syntax.ArrayTypeAnnotation :
        // handle T[]
        return getProperty('list', ns) + '(' + getType(ann.elementType, ns) + ')';

      case Syntax.GenericTypeAnnotation :
        if (ann.id.type === Syntax.Identifier) {
          var id = ann.id.name;
          // handle mixed type
          if (id === 'mixed') {
            return getProperty('mixed', ns);
          }
          if (ann.typeParameters) {
            // handle Array<T>
            var params = ann.typeParameters.params;
            if (params.length === 1) {
              return getProperty('list', ns) + '(' + getType(params[0], ns) + ')';
            }
          }
          // handle generic T, es: `var a: Person`
          return id;
        }

      case Syntax.TupleTypeAnnotation :
        // handle [T1, T2, ... , Tn]
        return getProperty('tuple', ns) + '([' + ann.types.map(function (type) {
          return getType(type, ns);
        }).join(', ') + '])';

      case Syntax.ObjectTypeAnnotation :
        if (ann.properties.length) {
          // handle {p1: T1; p2: T2; ... pn: Tn;}
          return getProperty('object', ns) + '({' + ann.properties.map(function (prop) {
            return prop.key.name + ': ' + getType(prop.value, ns);
          }).join(', ') + '})';
        } else if (ann.indexers.length === 1) {
          // handle {[key: D]: C}
          var domain = getType(ann.indexers[0].key, ns);
          var codomain = getType(ann.indexers[0].value, ns);
          return getProperty('dict', ns) + '(' + domain + ', ' + codomain + ')';
        }

      case Syntax.UnionTypeAnnotation :
        // handle T1 | T2 | ... | Tn
        return getProperty('union', ns) + '([' + ann.types.map(function (type) {
          return getType(type, ns);
        }).join(', ') + '])';
    }
  }
  return getProperty('any', ns);
}

//
// variable declarations
//

function visitTypedVariableDeclarator(traverse, node, path, state) {

  var ns = getOption('namespace', state);
  var ann = node.id.typeAnnotation;

  if (node.init) {
    utils.catchup(node.init.range[0], state);
    utils.append(getProperty('check', ns) + '(', state);
    traverse(node.init, path, state);
    utils.catchup(node.init.range[1], state);
    utils.append(', ' + getType(ann.typeAnnotation, ns) + ')', state);
  }

  utils.catchup(node.range[1], state);
  return false;
}
visitTypedVariableDeclarator.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator &&
    node.id.typeAnnotation;
};

//
// functions
//

function visitTypedFunction(traverse, node, path, state) {

  var ns = getOption('namespace', state);
  var types = [];
  var params = [];
  var rest = node.rest ? ', ' + getType(node.rest.typeAnnotation.typeAnnotation, ns) : '';
  node.params.forEach(function (param) {
    types.push(getType(param.typeAnnotation ? param.typeAnnotation.typeAnnotation : null, ns));
    params.push(param.name);
  });

  utils.catchup(node.body.range[0] + 1, state);

  if (params.length || rest) {
    utils.append(ns + '.check(arguments, ' + ns + '.args([' + types.join(', ') + ']' + rest + '));', state);
  }

  if (node.returnType) {
    var returnType = getType(node.returnType.typeAnnotation, ns);
    utils.append(' var ret = (function (' + params.join(', ') + ') {', state);
    utils.catchup(node.body.range[1], state);
    utils.append(').apply(this, arguments); return ' + ns + '.check(ret, ' + returnType + ');}', state);
  }

  utils.catchup(node.range[1], state);
  return false;
}
visitTypedFunction.test = function(node, path, state) {
  return (node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression) &&
  (node.returnType || node.params.some(function (param) { return !!param.typeAnnotation; }));
};

module.exports = {
  visitorList: [
    visitTypedFunction,
    visitTypedVariableDeclarator
  ]
};

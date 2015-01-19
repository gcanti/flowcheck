'use strict';

var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;
//console.log(Syntax);

function debug(x) {
  console.log(JSON.stringify(x, null, 2));
}

function getOption(name, state) {
  return state.g.opts[name];
}

function getProperty(name, tav) {
  return name in {'void': 1, 'boolean': 1} ? // compatibility with ES3
    tav + '["' + name + '"]' :
    tav + '.' + name;
}

function getType(ann, tav) {
  if (ann) {
    switch (ann.type) {

      case Syntax.StringTypeAnnotation :
        return getProperty('string', tav);
      case Syntax.NumberTypeAnnotation :
        return getProperty('number', tav);
      case Syntax.BooleanTypeAnnotation :
        return getProperty('boolean', tav);
      case Syntax.AnyTypeAnnotation :
        return getProperty('any', tav);
      case Syntax.VoidTypeAnnotation :
        return getProperty('void', tav);

      case Syntax.NullableTypeAnnotation :
        // handle ?T
        return getProperty('maybe', tav) + '(' + getType(ann.typeAnnotation, tav) + ')';

      case Syntax.ArrayTypeAnnotation :
        // handle T[]
        return getProperty('list', tav) + '(' + getType(ann.elementType, tav) + ')';

      case Syntax.GenericTypeAnnotation :
        if (ann.id.type === Syntax.Identifier) {
          var id = ann.id.name;
          // handle mixed type
          if (id === 'mixed') {
            return getProperty('mixed', tav);
          }
          if (ann.typeParameters) {
            // handle Array<T>
            var params = ann.typeParameters.params;
            if (params.length === 1) {
              return getProperty('list', tav) + '(' + getType(params[0], tav) + ')';
            }
          }
          // handle generic T, es: `var a: Person`
          return id;
        }

      case Syntax.TupleTypeAnnotation :
        // handle [T1, T2, ... , Tn]
        return getProperty('tuple', tav) + '([' + ann.types.map(function (type) {
          return getType(type, tav);
        }).join(', ') + '])';

      case Syntax.ObjectTypeAnnotation :
        if (ann.properties.length) {
          // handle {p1: T1; p2: T2; ... pn: Tn;}
          return getProperty('object', tav) + '({' + ann.properties.map(function (prop) {
            return prop.key.name + ': ' + getType(prop.value, tav);
          }).join(', ') + '})';
        } else if (ann.indexers.length === 1) {
          // handle {[key: D]: C}
          var domain = getType(ann.indexers[0].key, tav);
          var codomain = getType(ann.indexers[0].value, tav);
          return getProperty('dict', tav) + '(' + domain + ', ' + codomain + ')';
        }

      case Syntax.UnionTypeAnnotation :
        // handle T1 | T2 | ... | Tn
        return getProperty('union', tav) + '([' + ann.types.map(function (type) {
          return getType(type, tav);
        }).join(', ') + '])';
    }
  }
  return getProperty('any', tav);
}

function visitTypedVariableDeclarator(traverse, node, path, state) {

  var tav = getOption('typeAssertionVariable', state);
  var ann = node.id.typeAnnotation;

  if (node.init) {
    utils.catchup(node.init.range[0], state);
    utils.append(getProperty('check', tav) + '(', state);
    traverse(node.init, path, state);
    utils.catchup(node.init.range[1], state);
    utils.append(', ' + getType(ann.typeAnnotation, tav) + ')', state);
  }

  utils.catchup(node.range[1], state);
  return false;
}
visitTypedVariableDeclarator.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator &&
    node.id.typeAnnotation;
};

function visitTypedFunction(traverse, node, path, state) {

  var tav = getOption('typeAssertionVariable', state);
  var types = [];
  var params = [];
  var rest = node.rest ? ', ' + getType(node.rest.typeAnnotation.typeAnnotation, tav) : '';
  node.params.forEach(function (param) {
    types.push(getType(param.typeAnnotation ? param.typeAnnotation.typeAnnotation : null, tav));
    params.push(param.name);
  });

  utils.catchup(node.body.range[0] + 1, state);
  utils.append(tav + '.check(arguments, ' + tav + '.args([' + types.join(', ') + ']' + rest + '));', state);

  if (node.returnType) {
    var returnType = getType(node.returnType.typeAnnotation, tav);
    utils.append(' var ret = (function (' + params.join(', ') + ') {', state);
    utils.catchup(node.body.range[1], state);
    utils.append(').apply(this, arguments); return ' + tav + '.check(ret, ' + returnType + ');}', state);
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

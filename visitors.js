'use strict';

var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;
//console.log(Syntax);

function debug(x) {
  console.log(JSON.stringify(x, null, 2));
}

function commentOut(range, state) {
  utils.catchup(range[0], state);
  utils.append(' /* ', state);
  utils.catchup(range[1], state);
  utils.append(' */', state);
}

function getOption(name, state) {
  return state.g.opts[name];
}

function getProperty(name, typeAssertionVariable) {
  return name in {'void': 1, 'boolean': 1} ? // compatibility with ES3
    typeAssertionVariable + '["' + name + '"]' :
    typeAssertionVariable + '.' + name;
}

function getType(ann, t) {
  switch (ann.type) {
    case Syntax.StringTypeAnnotation :
      return getProperty('string', t);
    case Syntax.NumberTypeAnnotation :
      return getProperty('number', t);
    case Syntax.BooleanTypeAnnotation :
      return getProperty('boolean', t);
    case Syntax.AnyTypeAnnotation :
      return getProperty('any', t);
    case Syntax.VoidTypeAnnotation :
      return getProperty('void', t);
    case Syntax.NullableTypeAnnotation :
      // handle ?T
      return getProperty('maybe', t) + '(' + getType(ann.typeAnnotation, t) + ')';
    case Syntax.ArrayTypeAnnotation :
      // handle T[]
      return getProperty('list', t) + '(' + getType(ann.elementType, t) + ')';
    case Syntax.GenericTypeAnnotation :
      if (ann.id.type === Syntax.Identifier) {
        var id = ann.id.name;
        // handle mixed type
        if (id === 'mixed') {
          return getProperty('mixed', t);
        }
        // handle Array<T>
        var params = ann.typeParameters.params;
        if (params.length === 1) {
          // add list and recurse
          return getProperty('list', t) + '(' + getType(params[0], t) + ')';
        }
      }
    case Syntax.TupleTypeAnnotation :
      // handle [T1, T2, ... , Tn]
      return getProperty('tuple', t) + '([' + ann.types.map(function (type) {
        return getType(type, t);
      }).join(', ') + '])';
    case Syntax.ObjectTypeAnnotation :
      if (ann.properties.length) {
        // handle {p1: T1; p2: T2; ... pn: Tn;}
        return getProperty('object', t) + '({' + ann.properties.map(function (prop) {
          return prop.key.name + ': ' + getType(prop.value, t);
        }).join(', ') + '})';
      } else if (ann.indexers.length === 1) {
        // handle {[key: D]: C}
        var domain = getType(ann.indexers[0].key, t);
        var codomain = getType(ann.indexers[0].value, t);
        return getProperty('dict', t) + '(' + domain + ', ' + codomain + ')';
      }
    case Syntax.UnionTypeAnnotation :
      // handle T1 | T2 | ... | Tn
      return getProperty('union', t) + '([' + ann.types.map(function (type) {
        return getType(type, t);
      }).join(', ') + '])';
  }
  return 't.any /* [WARNING] ' + ann.type + ' */';
}

function visitVariableDeclarator(traverse, node, path, state) {
  var t = getOption('typeAssertionVariable', state);
  var ann = node.id.typeAnnotation;
  if (getOption('commentTypes', state)) {
    commentOut(ann.range, state);
  }
  if (node.init && getOption('typeAssertions', state)) {
    utils.catchup(node.init.range[0], state);
    utils.append(getProperty('check', t) + '(', state);
    utils.catchup(node.init.range[1], state);
    utils.append(', ' + getType(ann.typeAnnotation, t) + ')', state);
  }
}
visitVariableDeclarator.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator &&
    node.id.typeAnnotation;
};

module.exports = {
  getType: getType,
  visitorList: [
    visitVariableDeclarator
  ]
};

var varsToClean = [];
var prop = require('./symbol').for;
var createdVarsPropName = prop('__createdVars');

function definitionNameFor(varName) {
  return prop('__' + varName + 'LazyDefinition');
}

function getDefinition(context, definitionName) {
  return context[definitionName];
}

function markVarAsCreated(context, definitionName) {
  if (!context.hasOwnProperty(createdVarsPropName)) {
    context[createdVarsPropName] = {};
  }

  context[createdVarsPropName][definitionName] = getDefinition(context, definitionName);
}

function isCreated(context, definitionName) {
  var calledDefinitions = context[createdVarsPropName] || {};

  return calledDefinitions[definitionName] === getDefinition(context, definitionName);
}

var lazyVar = {
  register: function(context, name, definition) {
    var propName = definitionNameFor(name);

    if (context.hasOwnProperty(propName)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    context[propName] = definition;
  },

  isDefined: function(context, name) {
    return context && definitionNameFor(name) in context;
  },

  getOrCreate: function(context, name) {
    if (!lazyVar.isDefined(context, name)) {
      throw new Error('Lazy variable "' + name + '" is not defined.');
    }

    var definitionName = definitionNameFor(name);
    var definition = getDefinition(context, definitionName);

    if (!(name in context) || !isCreated(context, definitionName)) {
      context[name] = typeof definition === 'function' ? definition() : definition;
      markVarAsCreated(context, definitionName);
      varsToClean.push({ context: context, name: name });
    }

    return context[name];
  },

  cleanUp: function() {
    varsToClean.forEach(lazyVar.destroy);
    varsToClean.length = 0;
  },

  destroy: function(variable) {
    if (variable.context.hasOwnProperty(variable.name)) {
      delete variable.context[variable.name];
      delete variable.context[createdVarsPropName];
    }
  }
};

module.exports = lazyVar;

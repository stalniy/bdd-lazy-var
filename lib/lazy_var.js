var prop = require('./symbol').for;

var lazyVarsPropName = prop('__lazyVars');

var lazyVar = {
  register: function(context, name, definition, thisContext) {
    var hasOwnVariable = context.hasOwnProperty(name) && context.hasOwnProperty(lazyVarsPropName);

    if (hasOwnVariable && lazyVar.isDefined(context, name)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    var metadata = lazyVar.metadataFor(context);
    metadata.defs[name] = new VariableMetadata(definition, thisContext || context);

    lazyVar.defineProperty(context, name, metadata);
  },

  metadataFor: function(context, varName) {
    if (!context.hasOwnProperty(lazyVarsPropName)) {
      var lazyVarsInPrototype = context[lazyVarsPropName] ? context[lazyVarsPropName].defs : null;

      context[lazyVarsPropName] = {
        defs: Object.create(lazyVarsInPrototype),
        created: {}
      };
    }

    return arguments.length === 2 ? context[lazyVarsPropName].defs[varName] : context[lazyVarsPropName];
  },

  defineProperty: function(context, name, metadata) {
    Object.defineProperty(context, name, {
      configurable: true,

      get: function() {
        if (!metadata.created.hasOwnProperty(name)) {
          var definition = metadata.defs[name];
          var value = definition.value;

          metadata.created[name] = typeof value === 'function' ? value.call(definition.context) : value;
        }

        return metadata.created[name];
      }
    });
  },

  isDefined: function(context, name) {
    var hasLazyVars = context && context[lazyVarsPropName];

    return !!(hasLazyVars && context[lazyVarsPropName].defs[name]);
  },

  cleanUp: function(context) {
    if (context.hasOwnProperty(lazyVarsPropName)) {
      context[lazyVarsPropName].created = {};
    }
  }
};

function VariableMetadata(definition, thisContext) {
  this.value = definition;

  if (typeof thisContext === 'function') {
    Object.defineProperty(this, 'context', { get: thisContext });
  } else {
    this.context = thisContext;
  }
}

module.exports = lazyVar;

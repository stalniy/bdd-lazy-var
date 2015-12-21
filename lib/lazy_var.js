var prop = require('./symbol').for;

var lazyVarsPropName = prop('_lazyVars');

var lazyVar = {
  register: function(context, name, definition) {
    var hasOwnVariable = context.hasOwnProperty(name) && context.hasOwnProperty(lazyVarsPropName);

    if (hasOwnVariable && lazyVar.isDefined(context, name)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    if (!context.hasOwnProperty(lazyVarsPropName)) {
      context[lazyVarsPropName] = { defined: {}, created: {} };
    }

    var metadata = context[lazyVarsPropName];

    metadata.defined[name] = true;

    Object.defineProperty(context, name, {
      get: function() {
        if (!metadata.created.hasOwnProperty(name)) {
          metadata.created[name] = typeof definition === 'function' ? definition.call(this) : definition;
        }

        return metadata.created[name];
      }
    });
  },

  isDefined: function(context, name) {
    var hasLazyVars = context && context[lazyVarsPropName];

    return hasLazyVars && context[lazyVarsPropName].defined[name];
  },

  cleanUp: function(context) {
    if (context.hasOwnProperty(lazyVarsPropName)) {
      context[lazyVarsPropName].created = {};
    }
  }
};

module.exports = lazyVar;

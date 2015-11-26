var varsToClean = [];

function propNameFor(varName) {
  var name = '_lazy_' + varName + '_definition';

  return typeof Symbol !== 'undefined' ? Symbol.for(name) : name;
}

var lazyVar = {
  register: function(context, name, definition) {
    var propName = propNameFor(name);

    if (context.hasOwnProperty(propName)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    context[propName] = definition;
  },

  getOrCreate: function(context, name) {
    if (!(propNameFor(name) in context)) {
      throw new Error('"' + name + '" is not defined.');
    }

    var definition = lazyVar.getDefinition(context, name);

    if (!context.hasOwnProperty(name)) {
      context[name] = typeof definition === 'function' ? definition() : definition;
      varsToClean.push({ context: context, name: name });
    }

    return context[name];
  },

  getDefinition: function(context, name) {
    return context[propNameFor(name)];
  },

  cleanUp: function() {
    varsToClean.forEach(lazyVar.destroy);
    varsToClean.length = 0;
  },

  destroy: function(variable) {
    if (variable.context.hasOwnProperty(variable.name)) {
      delete variable.context[variable.name];
    }
  },
};

module.exports = lazyVar;

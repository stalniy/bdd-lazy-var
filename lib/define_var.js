var prop = require('./symbol').for;
var lazyVarsPropName = prop('__lazyVars');

function defineGetter(context, variable) {
  var vars = context[lazyVarsPropName] = context[lazyVarsPropName] || {};

  if (variable.name in vars) {
    return;
  }

  if (variable.name in context) {
    throw new Error([
      'Cannot create lazy variable "',
      variable.name,
      '" as variable with the same name exists on the provided context'
    ].join(''));
  }

  vars[variable.name] = true;
  Object.defineProperty(context, variable.name, { configurable: true, get: variable.get });
}

defineGetter.for = function(suite, variable, context) {
  defineGetter(context, { name: variable.name, get: variable.get });
  suite.afterAll(function() {
    delete context[variable.name];
  });
};

module.exports = defineGetter;

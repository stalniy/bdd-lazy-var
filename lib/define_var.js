var prop = require('./symbol').for;
var lazyVarsPropName = prop('__lazyVars');

module.exports = function(context, variable) {
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
};

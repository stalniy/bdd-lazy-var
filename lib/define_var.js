var prop = require('./symbol').for;
var lazyVar = require('./lazy_var')
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
  var varName = variable.originalName || variable.name;

  defineGetter(context, variable);

  if (suite.root || !lazyVar.isDefined(suite.parent.ctx, varName)) {
    var parentSuite = suite.parent || suite;

    parentSuite.afterAll(function() {
      delete context[lazyVarsPropName][variable.name];
      delete context[variable.name];
    });
  }
};

module.exports = defineGetter;

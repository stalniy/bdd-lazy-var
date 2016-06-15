var prop = require('./symbol').for;
var lazyVarsPropName = prop('__lazyVars');

function defineGetter(context, varName, options) {
  options = options || {};

  var accessorName = (options.getterPrefix ? options.getterPrefix : '') + varName;
  var varContext = options.defineOn || context;
  var vars = varContext[lazyVarsPropName] || {};

  if (!varContext[lazyVarsPropName]) {
    varContext[lazyVarsPropName] = vars;
  }

  if (accessorName in vars) {
    return;
  }

  if (accessorName in varContext) {
    throw new Error([
      'Cannot create lazy variable "',
      varName,
      '" as variable with the same name exists on the provided context'
    ].join(''));
  }

  vars[accessorName] = true;
  Object.defineProperty(varContext, accessorName, {
    configurable: true,
    get: function() {
      return context.get(varName);
    }
  });
}

module.exports = defineGetter;

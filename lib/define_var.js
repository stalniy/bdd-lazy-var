const prop = require('./symbol').for;

const LAZY_VARS_PROP_NAME = prop('__lazyVars');

function defineGetter(context, varName, options) {
  const params = {
    getterPrefix: '',
    defineOn: context,
    ...options
  };

  const accessorName = params.getterPrefix + varName;
  const varContext = params.defineOn;
  const vars = varContext[LAZY_VARS_PROP_NAME] = varContext[LAZY_VARS_PROP_NAME] || {};

  if (accessorName in vars) {
    return;
  }

  if (accessorName in varContext) {
    throw new Error(`Cannot create lazy variable "${varName}" as variable with the same name exists on the provided context`);
  }

  vars[accessorName] = true;
  Object.defineProperty(varContext, accessorName, {
    configurable: true,
    get: () => context.get(varName)
  });
}

module.exports = defineGetter;

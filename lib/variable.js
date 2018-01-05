var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');
var CURRENTLY_RETRIEVED_VAR_FIELD = Symbol.for('__currentVariableStack');

function Variable(varName, context) {
  this.name = varName;
  this.context = context;
  this.ownContext = context;
}

Variable.prototype.isSame = function(anotherVarName) {
  return this.name && (
    this.name === anotherVarName ||
    lazyVar.metadataFor(this.ownContext, this.name).hasAlias(anotherVarName)
  );
};

Variable.prototype.value = function() {
  return this.context[this.name];
};

Variable.prototype.addToStack = function() {
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

  return this;
};

Variable.prototype.release = function() {
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
};

Variable.prototype.valueInParentContext = function(varOrAliasName) {
  var prevContext = this.context;

  try {
    this.context = this.getParentContextFor(varOrAliasName);
    return this.context[varOrAliasName];
  } finally {
    this.context = prevContext;
  }
};

Variable.prototype.getParentContextFor = function(varName) {
  var metadata = lazyVar.metadataFor(this.context, varName);

  if (!metadata || !metadata.parent) {
    throw new Error('Unknown parent variable "' + varName + '".');
  }

  return metadata.parent;
};

Variable.EMPTY = new Variable(null, null);

Variable.allocate = function(varName, options) {
  var variable = new this(varName, options['in']);

  return variable.addToStack();
};

Variable.evaluate = function(varName, options) {
  var variable = Variable.fromStack(options['in']);

  if (variable.isSame(varName)) {
    return variable.valueInParentContext(varName);
  }

  try {
    variable = Variable.allocate(varName, options);
    return variable.value();
  } finally {
    variable.release();
  }
};

Variable.fromStack = function(context) {
  return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
}

function last(array) {
  return array ? array[array.length - 1] : null;
}

module.exports = Variable;

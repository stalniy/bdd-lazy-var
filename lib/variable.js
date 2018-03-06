const { Metadata } = require('./metadata');
const Symbol = require('./symbol');

const CURRENTLY_RETRIEVED_VAR_FIELD = Symbol.for('__currentVariableStack');
const last = array => array ? array[array.length - 1] : null;

class Variable {
  static allocate(varName, options) {
    const variable = new this(varName, options.in);

    return variable.addToStack();
  }

  static evaluate(varName, options) {
    if (!options.in) {
      throw new Error(`It looke like you are trying to evaluate "${varName}" too early`);
    }

    let variable = Variable.fromStack(options.in);

    if (variable.isSame(varName)) {
      return variable.valueInParentContext(varName);
    }

    try {
      variable = Variable.allocate(varName, options);
      return variable.value();
    } finally {
      variable.pullFromStack();
    }
  }

  static fromStack(context) {
    return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
  }

  constructor(varName, context) {
    this.name = varName;
    this.context = context;
    this.evaluationMeta = context ? Metadata.of(context) : null;
  }

  isSame(anotherVarName) {
    return this.name && (
      this.name === anotherVarName ||
      Metadata.of(this.context, this.name).isNamedAs(anotherVarName)
    );
  }

  value() {
    return this.evaluationMeta.getVar(this.name);
  }

  addToStack() {
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

    return this;
  }

  pullFromStack() {
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
  }

  valueInParentContext(varOrAliasName) {
    const meta = this.evaluationMeta;

    try {
      this.evaluationMeta = meta.lookupMetadataFor(varOrAliasName);
      return this.evaluationMeta.evaluate(varOrAliasName);
    } finally {
      this.evaluationMeta = meta;
    }
  }
}

Variable.EMPTY = new Variable(null, null);

module.exports = Variable;

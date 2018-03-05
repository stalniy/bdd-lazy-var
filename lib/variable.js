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
      variable.release();
    }
  }

  static fromStack(context) {
    return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
  }

  constructor(varName, context) {
    this.name = varName;
    this.context = context;
    this.evaluationCtx = context;
  }

  isSame(anotherVarName) {
    return this.name && (
      this.name === anotherVarName ||
      Metadata.of(this.context, this.name).isNamedAs(anotherVarName)
    );
  }

  value() {
    return Metadata.of(this.evaluationCtx).getVar(this.name);
  }

  addToStack() {
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

    return this;
  }

  release() {
    this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
  }

  valueInParentContext(varOrAliasName) {
    const ctx = this.evaluationCtx;

    try {
      this.evaluationCtx = this.getParentContextFor(varOrAliasName);
      return this.value();
    } finally {
      this.evaluationCtx = ctx;
    }
  }

  getParentContextFor(varName) {
    const metadata = Metadata.of(this.evaluationCtx);

    if (!metadata) {
      throw new Error(`Unable to find metadata for variable "${varName}"`);
    }

    return metadata.getParentContextFor(varName);
  }
}

Variable.EMPTY = new Variable(null, null);

module.exports = Variable;

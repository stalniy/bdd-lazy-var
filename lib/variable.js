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
    this.meta = context ? Metadata.of(context) : null;
  }

  isSame(anotherVarName) {
    return this.name && (
      this.name === anotherVarName ||
      Metadata.of(this.context, this.name).isNamedAs(anotherVarName)
    );
  }

  value() {
    return Metadata.of(this.context).getVar(this.name);
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
    const prevMeta = this.meta;

    try {
      this.meta = this.getParentMetadataFor(varOrAliasName);
      return this.meta.getVar(varOrAliasName);
    } finally {
      this.meta = prevMeta;
    }
  }

  getParentMetadataFor(varName) {
    const metadata = this.meta;

    if (!metadata || !metadata.defs[varName]) {
      throw new Error(`Unknown parent variable "${varName}".`);
    }

    return metadata.parent;
  }
}

Variable.EMPTY = new Variable(null, null);

module.exports = Variable;

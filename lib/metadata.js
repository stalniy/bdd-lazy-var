const Symbol = require('./symbol');

const LAZY_VARS_FIELD = Symbol.for('__lazyVars');
const EXAMPLES_PREFIX = '__SH_EX:';

class VariableMetadata {
  constructor(name, definition, metadata) {
    this.value = definition;
    this.parent = metadata;
    this.names = { [name]: true };
  }

  addName(name) {
    this.names[name] = true;
    return this;
  }

  isNamedAs(name) {
    return this.names[name];
  }

  evaluate() {
    return typeof this.value === 'function'
      ? this.value()
      : this.value;
  }
}

class Metadata {
  static of(context, varName) {
    const metadata = context[LAZY_VARS_FIELD];

    return varName && metadata ? metadata.defs[varName] : metadata;
  }

  static ensureDefinedOn(context) {
    if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD] = new Metadata();
    }

    return context[LAZY_VARS_FIELD];
  }

  constructor() {
    this.defs = {};
    this.values = {};
    this.hasValues = false;
    this.defined = false;
  }

  getVar(name) {
    if (!this.values.hasOwnProperty(name) && this.defs[name]) {
      this.hasValues = true;
      this.values[name] = this.evaluate(name);
    }

    return this.values[name];
  }

  evaluate(name) {
    return this.defs[name].evaluate();
  }

  addChild(child) {
    child.defs = Object.assign(Object.create(this.defs), child.defs);
    child.parent = this.defined ? this : this.parent;
  }

  addVar(name, definition) {
    if (this.defs.hasOwnProperty(name)) {
      throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
    }

    this.defined = true;
    this.defs[name] = new VariableMetadata(name, definition, this);

    return this;
  }

  addAliasFor(name, aliasName) {
    this.defs[aliasName] = this.defs[name].addName(aliasName);
  }

  releaseVars() {
    if (this.hasValues) {
      this.values = {};
      this.hasValues = false;
    }
  }

  lookupMetadataFor(varName) {
    const varMeta = this.defs[varName];
    const definedIn = varMeta.parent;

    if (!varMeta || !definedIn.parent.defs[varName]) {
      throw new Error(`Unknown parent variable "${varName}".`);
    }

    return definedIn.parent;
  }

  addExamplesFor(name, definition) {
    const examplesName = EXAMPLES_PREFIX + name;

    if (this.defs.hasOwnProperty(examplesName)) {
      throw new Error(`Attempt to override "${name}" shared example`);
    }

    return this.addVar(examplesName, definition);
  }

  runExamplesFor(name, args) {
    const examples = this.defs[EXAMPLES_PREFIX + name];

    if (!examples) {
      throw new Error(`Attempt to include not defined shared behavior "${name}"`);
    }

    return examples.value(...args);
  }
}

module.exports = { Metadata };

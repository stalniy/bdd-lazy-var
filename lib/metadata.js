const Symbol = require('./symbol');

const LAZY_VARS_FIELD = Symbol.for('__lazyVars');
const noop = () => {};

class VariableMetadata {
  constructor(name, definition) {
    this.value = definition;
    this.parent = null;
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
    const value = this.value;

    return typeof value === 'function' ? value() : value;
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

  static setVirtual(context, metadata) {
    const virtualMetadata = Object.create(metadata);

    virtualMetadata.releaseVars = noop;
    context[LAZY_VARS_FIELD] = virtualMetadata;
  }

  constructor() {
    this.defs = {};
    this.values = {};
    this.hasValues = false;
    this.defined = false;
  }

  getVar(name) {
    if (!this.values.hasOwnProperty(name)) {
      this.hasValues = true;
      if (this.defs[name] instanceof VariableMetadata) {
        this.values[name] = this.defs[name].evaluate();
      } else {
        this.values[name] = undefined;
      }
    }

    return this.values[name];
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
    this.defs[name] = new VariableMetadata(name, definition);

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
}

module.exports = { Metadata };

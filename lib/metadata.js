const Symbol = require('./symbol');

const LAZY_VARS_FIELD = Symbol.for('__lazyVars');

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
    return typeof this.value === 'function' ? this.value() : this.value;
  }
}

class Metadata {
  static of(context, varName) {
    const metadata = context[LAZY_VARS_FIELD];

    return varName && metadata ? metadata.defs[varName] : metadata;
  }

  static ensureDefinedOn(context) {
    if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD] = new Metadata(context);
    }

    return context[LAZY_VARS_FIELD];
  }

  static setVirtual(context, metadata) {
    const virtualMetadata = Object.create(metadata);

    virtualMetadata.ctx = context;
    virtualMetadata.values = {};
    context[LAZY_VARS_FIELD] = virtualMetadata;
  }

  constructor(context) {
    this.ctx = context;
    this.defs = {};
    this.values = {};
    this.hasValues = false;
    this.defined = false;
  }

  getVar(name) {
    if (!this.values.hasOwnProperty(name) && this.defs[name]) {
      this.hasValues = true;
      this.values[name] = this.defs[name].evaluate();
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

  getParentContextFor(varName) {
    const varMeta = this.defs[varName];
    const definedIn = varMeta.parent;

    if (!varMeta || !definedIn.parent.defs[varName]) {
      throw new Error(`Unknown parent variable "${varName}".`);
    }

    return definedIn.parent.ctx;
  }
}

module.exports = { Metadata };

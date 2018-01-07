const Symbol = require('./symbol');

const LAZY_VARS_FIELD = Symbol.for('__lazyVars');

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
      const lazyVarsInPrototype = context[LAZY_VARS_FIELD];
      context[LAZY_VARS_FIELD] = lazyVarsInPrototype ? lazyVarsInPrototype.addChild(context) : new Metadata(context);
    }

    return context[LAZY_VARS_FIELD];
  }

  static ownBy(context) {
    if (context.hasOwnProperty(LAZY_VARS_FIELD)) {
      return Metadata.of(context);
    }
  }

  constructor(context) {
    this.context = context;
    this.defs = {};
    this.created = {};
  }

  getVar(name) {
    if (!this.created.hasOwnProperty(name)) {
      this.created[name] = this.defs[name].evaluate();
    }

    return this.created[name];
  }

  addChild(context) {
    const child = new Metadata(context);
    child.defs = Object.create(this.defs);

    return child;
  }

  addVar(name, definition) {
    if (this.defs.hasOwnProperty(name)) {
      throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
    }

    this.defs[name] = new VariableMetadata(name, definition);
    return this;
  }

  addAliasFor(name, aliasName) {
    this.defs[aliasName] = this.defs[name].addName(aliasName);
  }

  releaseVars() {
    this.created = {};
  }
}

module.exports = { Metadata };

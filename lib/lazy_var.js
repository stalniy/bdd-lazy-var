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
}

class Metadata {
  constructor(context) {
    this.context = context;
    this.defs = {};
    this.created = {};
  }

  getVar(name) {
    if (!this.created.hasOwnProperty(name)) {
      this.created[name] = this.evaluateVar(name);
    }

    return this.created[name];
  }

  evaluateVar(name) {
    const definition = this.defs[name];
    const value = definition.value;

    return typeof value === 'function' ? value() : value;
  }

  addChild(context) {
    const child = new Metadata(context);
    child.defs = Object.create(this.defs);

    return child;
  }

  releaseVars() {
    this.created = {};
  }
}

const lazyVar = {
  register(context, name, definition) {
    const metadata = lazyVar.metadataFor(context);

    if (metadata.defs.hasOwnProperty(name)) {
      throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
    }

    metadata.defs[name] = new VariableMetadata(name, definition);
  },

  metadataFor(context, varName) {
    if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
      const lazyVarsInPrototype = context[LAZY_VARS_FIELD];
      context[LAZY_VARS_FIELD] = lazyVarsInPrototype ? lazyVarsInPrototype.addChild(context) : new Metadata(context);
    }

    const metadata = context[LAZY_VARS_FIELD];

    return varName ? metadata.defs[varName] : metadata;
  },

  getMetadataFor(context, name) {
    const metadata = context[LAZY_VARS_FIELD];

    return name && metadata ? metadata.defs[name] : metadata;
  },

  registerAlias(context, varName, aliasName) {
    const metadata = lazyVar.metadataFor(context);

    metadata.defs[aliasName] = metadata.defs[varName].addName(aliasName);
  },

  isDefined(context, name) {
    const hasLazyVars = context && context[LAZY_VARS_FIELD];

    return !!(hasLazyVars && context[LAZY_VARS_FIELD].defs[name]);
  },

  cleanUp(context) {
    if (context.hasOwnProperty(LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD].releaseVars();
    }
  }
};

module.exports = lazyVar;

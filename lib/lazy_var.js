const Symbol = require('./symbol');

const LAZY_VARS_FIELD = Symbol.for('__lazyVars');

class VariableMetadata {
  constructor(definition, thisContext) {
    this.value = definition;
    this.parent = null;
    this.aliases = null;

    if (typeof thisContext === 'function') {
      Object.defineProperty(this, 'context', { get: thisContext });
    } else {
      this.context = thisContext;
    }
  }

  addName(name) {
    this.aliases = this.aliases || {};
    this.aliases[name] = true;
    return this;
  }

  isNamedAs(name) {
    return this.aliases && this.aliases[name];
  }
}

const lazyVar = {
  register(context, name, definition, thisContext) {
    const metadata = lazyVar.metadataFor(context);

    if (metadata.defs.hasOwnProperty(name)) {
      throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
    }

    metadata.defs[name] = new VariableMetadata(definition, thisContext || context).addName(name);
    lazyVar.defineProperty(context, name, metadata);
  },

  metadataFor(context, varName) {
    if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
      const lazyVarsInPrototype = context[LAZY_VARS_FIELD] ? context[LAZY_VARS_FIELD].defs : Object.prototype;

      context[LAZY_VARS_FIELD] = {
        defs: Object.create(lazyVarsInPrototype),
        created: {}
      };
    }

    const metadata = context[LAZY_VARS_FIELD];

    return varName ? metadata.defs[varName] : metadata;
  },

  defineProperty(context, name, metadata) {
    Object.defineProperty(context, name, {
      configurable: true,

      get() {
        if (!metadata.created.hasOwnProperty(name)) {
          const definition = metadata.defs[name];
          const value = definition.value;

          metadata.created[name] = typeof value === 'function' ? value.call(definition.context) : value;
        }

        return metadata.created[name];
      }
    });
  },

  registerAlias(context, varName, aliasName) {
    const metadata = lazyVar.metadataFor(context);

    metadata.defs[aliasName] = metadata.defs[varName].addName(aliasName);
    Object.defineProperty(context, aliasName, {
      get() {
        return this[varName];
      }
    });
  },

  isDefined(context, name) {
    const hasLazyVars = context && context[LAZY_VARS_FIELD];

    return !!(hasLazyVars && context[LAZY_VARS_FIELD].defs[name]);
  },

  cleanUp(context) {
    if (context.hasOwnProperty(LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD].created = {};
    }
  }
};

module.exports = lazyVar;

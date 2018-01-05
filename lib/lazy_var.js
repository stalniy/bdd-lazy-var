const Symbol = require('./symbol');

const lazyVarsPropName = Symbol.for('__lazyVars');

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

  addAlias(name) {
    this.aliases = this.aliases || {};
    this.aliases[name] = true;
  }

  hasAlias(name) {
    return this.aliases && this.aliases[name];
  }

  buildAliasMetadata(aliasName) {
    const aliasMetadata = new VariableMetadata(null, null);

    aliasMetadata.aliases = this.aliases;
    this.addAlias(aliasName);

    return aliasMetadata;
  }
}

const lazyVar = {
  register(context, name, definition, thisContext) {
    const hasOwnVariable = context.hasOwnProperty(name) && context.hasOwnProperty(lazyVarsPropName);

    if (hasOwnVariable && lazyVar.isDefined(context, name)) {
      throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
    }

    const metadata = lazyVar.metadataFor(context);
    metadata.defs[name] = new VariableMetadata(definition, thisContext || context);

    lazyVar.defineProperty(context, name, metadata);
  },

  metadataFor(context, varName) {
    if (!context.hasOwnProperty(lazyVarsPropName)) {
      const lazyVarsInPrototype = context[lazyVarsPropName] ? context[lazyVarsPropName].defs : null;

      context[lazyVarsPropName] = {
        defs: Object.create(lazyVarsInPrototype),
        created: {}
      };
    }

    const metadata = context[lazyVarsPropName];

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

    metadata.defs[aliasName] = metadata.defs[varName].buildAliasMetadata(aliasName);
    metadata.defs[aliasName].addAlias(varName);
    Object.defineProperty(context, aliasName, {
      get() {
        return this[varName];
      }
    });
  },

  isDefined(context, name) {
    const hasLazyVars = context && context[lazyVarsPropName];

    return !!(hasLazyVars && context[lazyVarsPropName].defs[name]);
  },

  cleanUp(context) {
    if (context.hasOwnProperty(lazyVarsPropName)) {
      context[lazyVarsPropName].created = {};
    }
  }
};

module.exports = lazyVar;

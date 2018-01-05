const lazyVar = require('./lazy_var');
const Variable = require('./variable');

module.exports = (context, tracker, options) => {
  function get(varName) {
    return Variable.evaluate(varName, { in: tracker.currentContext() });
  }

  get.definitionOf = get.variable = varName => get.bind(null, varName);

  function def(varName, definition) {
    const suite = tracker.currentlyDefinedSuite;

    if (Array.isArray(varName)) {
      def(varName[0], definition);
      defineAliasesFor(suite, varName[0], varName.slice(1));
    } else {
      lazyVar.register(suite.ctx, varName, definition, tracker.currentContext);
      detectParentDeclarationFor(suite, varName);
    }
  }

  function subject(...args) {
    const [name, definition] = args;

    if (args.length === 1) {
      return def('subject', name);
    }

    if (args.length === 2) {
      return def([name, 'subject'], definition);
    }

    return get('subject');
  }

  function detectParentDeclarationFor(suite, varName) {
    if (suite.parent && lazyVar.isDefined(suite.parent.ctx, varName)) {
      lazyVar.metadataFor(suite.ctx, varName).parent = suite.parent.ctx;
    }

    if (typeof options.onDefineVariable === 'function') {
      options.onDefineVariable(suite, varName, context);
    }
  }

  function defineAliasesFor(suite, varName, aliases) {
    aliases.forEach((alias) => {
      lazyVar.registerAlias(suite.ctx, varName, alias);
      detectParentDeclarationFor(suite, alias);
    });
  }

  return { subject, def, get };
};

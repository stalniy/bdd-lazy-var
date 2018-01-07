const { Metadata } = require('./metadata');
const Variable = require('./variable');

module.exports = (context, tracker, options) => {
  function get(varName) {
    return Variable.evaluate(varName, { in: tracker.currentContext });
  }

  get.definitionOf = get.variable = varName => get.bind(null, varName);

  function def(varName, definition) {
    const suite = tracker.currentlyDefinedSuite;

    if (Array.isArray(varName)) {
      def(varName[0], definition);
      defineAliasesFor(suite, varName[0], varName.slice(1));
    } else {
      Metadata.ensureDefinedOn(suite).addVar(varName, definition);
      runHook('onDefineVariable', suite, varName);
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

  function runHook(name, ...args) {
    if (typeof options[name] === 'function') {
      options[name](...args.concat(context));
    }
  }

  function defineAliasesFor(suite, varName, aliases) {
    const metadata = Metadata.of(suite);

    aliases.forEach((alias) => {
      metadata.addAliasFor(varName, alias);
      runHook('onDefineVariable', suite, alias);
    });
  }

  return { subject, def, get };
};

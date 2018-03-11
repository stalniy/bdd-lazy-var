const { Metadata } = require('./metadata');
const Variable = require('./variable');
const { sharedExamplesFor, includeExamplesFor, itBehavesLike } = require('./shared_behavior');

module.exports = (context, tracker, options) => {
  const get = varName => Variable.evaluate(varName, { in: tracker.currentContext });

  get.definitionOf = get.variable = varName => get.bind(null, varName);

  function def(varName, definition) {
    const suite = tracker.currentlyDefinedSuite;

    if (!Array.isArray(varName)) {
      Metadata.ensureDefinedOn(suite).addVar(varName, definition);
      runHook('onDefineVariable', suite, varName);
      return;
    }

    const [name, ...aliases] = varName;
    def(name, definition);

    const metadata = Metadata.of(suite);
    aliases.forEach((alias) => {
      metadata.addAliasFor(name, alias);
      runHook('onDefineVariable', suite, alias);
    });
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

  return {
    subject,
    def,
    get,
    sharedExamplesFor,
    includeExamplesFor,
    itBehavesLike
  };
};

const { Metadata } = require('./metadata');
const Variable = require('./variable');

module.exports = (context, tracker, options) => {
  const get = varName => Variable.evaluate(varName, { in: tracker.currentContext });

  get.definitionOf = get.variable = varName => get.bind(null, varName);

  function def(varName, definition) {
    const suite = tracker.currentlyDefinedSuite;

    if (!Array.isArray(varName)) {
      Metadata.ensureDefinedOn(suite).addVar(varName, definition);
      runHook(definition.passBack ? null : 'onDefineVariable', suite, varName);
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

  const EXAMPLES_PREFIX = 'SHARED';
  function sharedExamplesFor(name, defs) {
    try {
      defs.passBack = true;
      def(`${EXAMPLES_PREFIX}:${name}`, defs);
    } catch (error) {
      throw new Error(`Attempt to override "${name}" shared example`);
    }
  }

  function includeExamplesFor(name, ...args) {
    const examples = get(`${EXAMPLES_PREFIX}:${name}`);

    if (!examples) {
      throw new Error(`Attempt to include not defined shared behavior "${name}"`);
    }

    return examples(...args);
  }

  function itBehavesLike(name, ...args) {
    global.describe(`behaves like ${name}`, () => {
      includeExamplesFor(name, ...args);
    });
  }

  function runHook(name, suite, varName) {
    if (name && typeof options[name] === 'function') {
      options[name](suite, varName, context);
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

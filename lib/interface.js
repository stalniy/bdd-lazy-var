const { Metadata } = require('./metadata');
const Variable = require('./variable');
const parseMessage = require('./parse_message');

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

  function sharedExamplesFor(name, defs) {
    Metadata.ensureDefinedOn(tracker.currentlyDefinedSuite)
      .addExamplesFor(name, defs);
  }

  function includeExamplesFor(name, ...args) {
    Metadata.ensureDefinedOn(tracker.currentlyDefinedSuite)
      .runExamplesFor(name, args);
  }

  function itBehavesLike(name, ...args) {
    context.describe(`behaves like ${name}`, () => {
      args.unshift(name);
      includeExamplesFor.apply(tracker.currentlyDefinedSuite, args);
    });
  }

  const wrapIts = test => function its(prop, messageOrAssert, fn) {
    const [message, assert] = typeof messageOrAssert === 'function'
      ? [parseMessage(messageOrAssert), messageOrAssert]
      : [messageOrAssert, fn];

    return context.describe(prop, () => {
      def('__itsSubject__', () => prop.split('.').reduce((object, field) => {
        const value = object[field];

        return typeof value === 'function'
          ? object[field]()
          : value;
      }, subject()));

      test(message || 'is correct', assert);
    });
  };

  // TODO: `shouldWrapAssert` can be removed when https://github.com/facebook/jest/issues/6516 fixed
  const wrapIt = (test, shouldWrapAssert) => function it(...args) {
    if (typeof args[0] === 'function') {
      args.unshift(parseMessage(args[0]));
    }

    if (shouldWrapAssert) {
      const assert = args[1];
      args[1] = function testWrapper(...testArgs) {
        const value = assert.apply(this, testArgs);
        return value && typeof value.then === 'function' ? value : undefined;
      };
    }

    return test(...args);
  };

  function runHook(name, suite, varName) {
    if (name && typeof options[name] === 'function') {
      options[name](suite, varName, context);
    }
  }

  const is = {
    get expected() {
      const name = Metadata.of(tracker.currentContext, '__itsSubject__')
        ? '__itsSubject__'
        : 'subject';
      return context.expect(get(name));
    }
  };

  return {
    subject,
    def,
    get,
    wrapIt,
    wrapIts,
    is,
    sharedExamplesFor,
    includeExamplesFor,
    itBehavesLike
  };
};

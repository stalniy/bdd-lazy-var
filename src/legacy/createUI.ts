import { Metadata, Suite } from './Metadata.ts';
import { parseMessage, humanize } from './utils.ts';
import { SuiteTracker } from './SuiteTracker.ts';

export interface CreateUIOptions {
  onDefineVariable?: (suite: Suite, varName: string, context: TestContextInput) => void;
}

export interface TestContextInput {
  describe: (...args: any[]) => any;
  expect: (value: unknown) => any;
}

interface TestContext extends TestContextInput {
  get: ((varName: string) => unknown) & {
    definitionOf: (varName: string) => () => unknown;
    variable: (varName: string) => () => unknown;
  };
}

type TestFn = (...args: any[]) => any;

export function createUI(context: TestContextInput, tracker: SuiteTracker, options: CreateUIOptions = {}) {
  const get = ((varName: string) => {
    const meta = Metadata.of(tracker.currentContext as Suite);
    return meta?.getVarValue(varName);
  }) as TestContext['get'];

  get.definitionOf = get.variable = (varName: string) => get.bind(null, varName);

  function def(varName: string | string[], definition: unknown): void {
    const suite = tracker.currentlyDefinedSuite as Suite;

    if (!Array.isArray(varName)) {
      Metadata.ensureDefinedOn(suite).addVar(varName, definition);
      runHook('onDefineVariable', suite, varName);
      return;
    }

    const [name, ...aliases] = varName;
    def(name, definition);

    const metadata = Metadata.of(suite)!;
    aliases.forEach((alias) => {
      metadata.addAliasFor(name, alias);
      runHook('onDefineVariable', suite, alias);
    });
  }

  function subject(...args: unknown[]): unknown {
    const [name, definition] = args;

    if (args.length === 1) {
      return def('subject', name);
    }

    if (args.length === 2) {
      return def([name as string, 'subject'], definition);
    }

    return get('subject');
  }

  function sharedExamplesFor(name: string, defs: (...args: unknown[]) => void): void {
    Metadata.ensureDefinedOn(tracker.currentlyDefinedSuite as Suite)
      .addExamplesFor(name, defs);
  }

  function includeExamplesFor(nameOrFn: string | ((...args: unknown[]) => void), ...args: unknown[]): void {
    const meta = Metadata.ensureDefinedOn(tracker.currentlyDefinedSuite as Suite);

    if (typeof nameOrFn === 'function') {
      nameOrFn(...args);
    } else {
      meta.runExamplesFor(nameOrFn, args);
    }
  }

  function itBehavesLike(...args: [string | ((...a: unknown[]) => void), ...unknown[]]): void {
    const nameOrFn = args[0];
    const title = typeof nameOrFn === 'function' ? humanize(nameOrFn.name || 'this') : nameOrFn;

    context.describe(`behaves like ${title}`, () => {
      includeExamplesFor(...args);
    });
  }

  const wrapIts = (test: TestFn) => function its(prop: string, messageOrAssert: string | ((...args: unknown[]) => unknown), fn?: (...args: unknown[]) => unknown) {
    const [message, assert] = typeof messageOrAssert === 'function'
      ? [parseMessage(messageOrAssert), messageOrAssert]
      : [messageOrAssert, fn];

    return context.describe(prop, () => {
      def('__itsSubject__', () => prop.split('.').reduce((object: any, field: string) => {
        const value = object[field];

        return typeof value === 'function'
          ? object[field]()
          : value;
      }, subject()));

      test(message || 'is correct', assert);
    });
  };

  // TODO: `shouldWrapAssert` can be removed when https://github.com/facebook/jest/issues/6516 fixed
  const wrapIt = (test: TestFn, shouldWrapAssert?: boolean) => function it(...args: any[]) {
    if (typeof args[0] === 'function') {
      args.unshift(parseMessage(args[0]));
    }

    if (shouldWrapAssert) {
      const assert = args[1];
      args[1] = function testWrapper(this: unknown, ...testArgs: unknown[]) {
        const value = assert.apply(this, testArgs);
        return value && typeof value.then === 'function' ? value : undefined;
      };
    }

    return test(...args);
  };

  function runHook(name: keyof CreateUIOptions, suite: Suite, varName: string): void {
    if (name && typeof options[name] === 'function') {
      options[name](suite, varName, context);
    }
  }

  const is = {
    get expected() {
      const name = Metadata.of(tracker.currentContext as Suite)?.hasVar('__itsSubject__')
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
}

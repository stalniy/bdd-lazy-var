import { setOnValueCreated, lazy } from '../LazyVariables';
import { parseMessage } from '../parseMessage';

export function setup() {
  const ACCESSIBLE_VALUES = new Set<Map<PropertyKey, unknown>>();

  setOnValueCreated((value, key, values) => {
    ACCESSIBLE_VALUES.add(values);
  });

  afterEach(() => {
    for (const values of ACCESSIBLE_VALUES) {
      values.clear();
    }

    ACCESSIBLE_VALUES.clear();
  });
}

type TestCase = (...args: unknown[]) => unknown;
type Test = (message: string, fn: TestCase) => unknown;

export const createIts = (describe: Test, test: Test) => function its<T extends Record<string, unknown>>(
  prop: keyof T,
  messageOrAssert: string | TestCase,
  fn: TestCase
) {
  const [message, assert] = typeof messageOrAssert === 'function'
    ? [parseMessage(messageOrAssert), messageOrAssert]
    : [messageOrAssert, fn];

  return describe(prop.toString(), () => {
    lazy(d => d.extends(getCurrentScope())
      .variable('itsSubject', (v) => {
        return prop.toString()
          .split('.')
          .reduce((object, field) => {
            const value = object[field];

            return typeof value === 'function'
              ? object[field]()
              : value;
          }, v.subject)
      })
    );

    test(message || 'is correct', assert);
  });
};

// TODO: `shouldWrapAssert` can be removed when https://github.com/facebook/jest/issues/6516 fixed
export const wrapIt = (test: Test, shouldWrapAssert = false) => function it(...args: Parameters<Test>) {
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

export const is = {
  get expected() {
    const $ = getCurrentScope();
    const name = $.hasOwnProperty('itsSubject')
      ? 'itsSubject'
      : 'subject';
    return expect($[name]);
  }
};

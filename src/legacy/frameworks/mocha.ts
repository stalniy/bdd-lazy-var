import Mocha from 'mocha';
import { createUI, CreateUIOptions, TestContextInput } from '../createUI.ts';
import { SuiteTracker } from '../SuiteTracker.ts';

function createSuiteTracker() {
  return {
    before(tracker: SuiteTracker, suite: Mocha.Suite) {
      suite.beforeAll(tracker.registerSuite.bind(tracker, suite));
    },

    after(tracker: SuiteTracker, suite: Mocha.Suite) {
      suite.beforeAll(tracker.cleanUpCurrentContext);
      suite.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    }
  };
}

function addInterface(rootSuite: Mocha.Suite, options: CreateUIOptions & { Tracker: typeof SuiteTracker }) {
  const tracker = new options.Tracker({ rootSuite, suiteTracker: createSuiteTracker() });
  let ui: ReturnType<typeof createUI> | undefined;

  rootSuite.afterEach(tracker.cleanUpCurrentContext);
  rootSuite.on('pre-require', (context) => {
    const { describe, it } = context;

    if (!ui) {
      (context as TestContextInput).expect = globalThis.expect;
      ui = createUI(context as TestContextInput, tracker, options);
      const { wrapIts, wrapIt, ...restUi } = ui;
      Object.assign(context, restUi);
    }

    const overwrites = context as any;
    overwrites.its = ui.wrapIts(it);
    overwrites.its.only = ui.wrapIts(it.only);
    overwrites.its.skip = ui.wrapIts(it.skip);
    overwrites.it = ui.wrapIt(it);
    overwrites.it.only = ui.wrapIt(it.only);
    overwrites.it.skip = ui.wrapIt(it.skip);
    overwrites.describe = tracker.wrapSuite(describe);
    overwrites.describe.skip = tracker.wrapSuite(describe.skip);
    overwrites.describe.only = tracker.wrapSuite(describe.only);
    overwrites.context = overwrites.describe;
    overwrites.xdescribe = overwrites.xcontext = overwrites.describe.skip;
  });
}

export function createFrameworkUI(name: string, options: CreateUIOptions & {
  inheritUi?: string;
  Tracker?: typeof SuiteTracker;
}): unknown {
  const config = {
    Tracker: SuiteTracker,
    inheritUi: 'bdd',
    ...options
  };

  const interfaces = Mocha.interfaces as Record<string, (rootSuite: Mocha.Suite) => void>;
  interfaces[name] = (rootSuite: Mocha.Suite) => {
    interfaces[config.inheritUi](rootSuite);
    return addInterface(rootSuite, config);
  };

  const getters = ['get', 'def', 'subject', 'its', 'it', 'is', 'sharedExamplesFor', 'includeExamplesFor', 'itBehavesLike'];
  const defs = getters.reduce<Record<string, PropertyDescriptor>>((all, uiName) => {
    all[uiName] = { get: () => (global as any)[uiName] };
    return all;
  }, {});

  return Object.defineProperties(interfaces[name], defs);
}

import { createUI, CreateUIOptions } from '../createUI.ts';
import { SuiteTracker } from '../SuiteTracker.ts';

function createSuiteTracker() {
  return {
    before(tracker: SuiteTracker, suite: jasmine.Suite) {
      global.beforeAll(tracker.registerSuite.bind(tracker, suite));
      global.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    },

    after(tracker: SuiteTracker) {
      global.beforeAll(tracker.cleanUpCurrentContext);
    }
  };
}

function addInterface(rootSuite: jasmine.Suite, options: CreateUIOptions & { Tracker: typeof SuiteTracker }) {
  const context = global;
  const tracker = new options.Tracker({ rootSuite, suiteTracker: createSuiteTracker() });
  const { wrapIts, wrapIt, ...ui } = createUI(context, tracker, options);
  const isJest = typeof jest !== 'undefined';

  Object.assign(context, ui);
  const overwrites = context as any;
  ['', 'x', 'f'].forEach((prefix) => {
    const describeKey = `${prefix}describe`;
    const itKey = `${prefix}it`;

    overwrites[`${itKey}s`] = wrapIts(overwrites[itKey]);
    overwrites[itKey] = wrapIt(overwrites[itKey], isJest);
    overwrites[describeKey] = tracker.wrapSuite(overwrites[describeKey]);
    overwrites[`${prefix}context`] = overwrites[describeKey];
  });
  context.afterEach(tracker.cleanUpCurrentContext);

  return ui;
}


export function createFrameworkUI(_: string, options: CreateUIOptions & { Tracker?: typeof SuiteTracker } = {}): unknown {
  const config = { Tracker: SuiteTracker, ...options };
  return addInterface(global.jasmine.getEnv().topSuite(), config);
}

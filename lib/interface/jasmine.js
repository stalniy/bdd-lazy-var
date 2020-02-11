const createLazyVarInterface = require('../interface');
const SuiteTracker = require('../suite_tracker');

function createSuiteTracker() {
  return {
    before(tracker, suite) {
      global.beforeAll(tracker.registerSuite.bind(tracker, suite));
      global.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    },

    after(tracker) {
      global.beforeAll(tracker.cleanUpCurrentContext);
    }
  };
}

function addInterface(rootSuite, options) {
  const context = global;
  const tracker = new options.Tracker({ rootSuite, suiteTracker: createSuiteTracker() });
  const { wrapIts, wrapIt, ...ui } = createLazyVarInterface(context, tracker, options);
  const isJest = typeof jest !== 'undefined';

  Object.assign(context, ui);
  ['', 'x', 'f'].forEach((prefix) => {
    const describeKey = `${prefix}describe`;
    const itKey = `${prefix}it`;

    context[`${itKey}s`] = wrapIts(context[itKey]);
    context[itKey] = wrapIt(context[itKey], isJest);
    context[describeKey] = tracker.wrapSuite(context[describeKey]);
    context[`${prefix}context`] = context[describeKey];
  });
  context.afterEach(tracker.cleanUpCurrentContext);

  return ui;
}

module.exports = {
  createUi(name, options) {
    const config = { Tracker: SuiteTracker, ...options };

    return addInterface(global.jasmine.getEnv().topSuite(), config);
  }
};

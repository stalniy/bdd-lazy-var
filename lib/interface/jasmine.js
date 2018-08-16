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
  ['it', 'fit', 'xit'].forEach((name) => {
    context[`${name}s`] = wrapIts(context[name]);
    context[name] = wrapIt(context[name], isJest);
  });
  ['', 'x', 'f'].forEach((prefix) => {
    const name = `${prefix}describe`;
    context[name] = tracker.wrapSuite(context[name]);
    context[`${prefix}context`] = context[name];
  });
  context.afterEach(tracker.cleanUpCurrentContext);

  return ui;
}

module.exports = {
  createUi(name, options) {
    const config = Object.assign({
      Tracker: SuiteTracker,
    }, options);

    return addInterface(global.jasmine.getEnv().topSuite(), config);
  }
};

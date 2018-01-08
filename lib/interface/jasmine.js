const createLazyVarInterface = require('../interface');
const SuiteTracker = require('../suite_tracker');

function createSuiteTracker() {
  return {
    before(tracker) {
      global.beforeAll(tracker.registerSuite);
      global.afterEach(tracker.cleanUp);
      global.afterAll(tracker.cleanUpAndRestorePrev);
    },

    after(tracker) {
      global.beforeAll(tracker.cleanUp);
    }
  };
}

function addInterface(rootSuite, options) {
  const context = global;
  const tracker = new options.Tracker({ rootSuite, suiteTracker: createSuiteTracker() });
  const ui = createLazyVarInterface(context, tracker, options);

  Object.assign(context, ui);
  context.describe = tracker.wrapSuite(context.describe);
  context.xdescribe = tracker.wrapSuite(context.xdescribe);
  context.fdescribe = tracker.wrapSuite(context.fdescribe);
}

module.exports = {
  createUi(name, options) {
    const config = Object.assign({
      Tracker: SuiteTracker,
    }, options);

    addInterface(global.jasmine.getEnv().topSuite(), config);
  }
};

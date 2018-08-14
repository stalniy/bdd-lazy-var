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
  const ui = createLazyVarInterface(context, tracker, options);
  const isJest = typeof jest !== 'undefined';

  Object.assign(context, ui);
  context.its = ui.wrapIts(context.it);
  context.fits = ui.wrapIts(context.fit);
  context.xits = ui.wrapIts(context.xit);
  context.it = ui.wrapIt(context.it, isJest);
  context.fit = ui.wrapIt(context.fit, isJest);
  context.xit = ui.wrapIt(context.xit, isJest);
  context.describe = tracker.wrapSuite(context.describe);
  context.xdescribe = tracker.wrapSuite(context.xdescribe);
  context.fdescribe = tracker.wrapSuite(context.fdescribe);
  context.context = context.describe;
  context.xcontext = context.xdescribe;
  context.fdescribe = context.fdescribe;
  global.afterEach(tracker.cleanUpCurrentContext);

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

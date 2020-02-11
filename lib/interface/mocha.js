const Mocha = require('mocha'); // eslint-disable-line
const createLazyVarInterface = require('../interface');
const SuiteTracker = require('../suite_tracker');

function createSuiteTracker() {
  return {
    before(tracker, suite) {
      suite.beforeAll(tracker.registerSuite.bind(tracker, suite));
    },

    after(tracker, suite) {
      suite.beforeAll(tracker.cleanUpCurrentContext);
      suite.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    }
  };
}

function addInterface(rootSuite, options) {
  const tracker = new options.Tracker({ rootSuite, suiteTracker: createSuiteTracker() });
  let ui;

  rootSuite.afterEach(tracker.cleanUpCurrentContext);
  rootSuite.on('pre-require', (context) => {
    const { describe, it } = context;

    if (!ui) {
      ui = createLazyVarInterface(context, tracker, options);
      const { wrapIts, wrapIt, ...restUi } = ui;
      Object.assign(context, restUi);
    }

    context.its = ui.wrapIts(it);
    context.its.only = ui.wrapIts(it.only);
    context.its.skip = ui.wrapIts(it.skip);
    context.it = ui.wrapIt(it);
    context.it.only = ui.wrapIt(it.only);
    context.it.skip = ui.wrapIt(it.skip);
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);
    context.context = context.describe;
    context.xdescribe = context.xcontext = context.describe.skip;
  });
}

module.exports = {
  createUi(name, options) {
    const config = {
      Tracker: SuiteTracker,
      inheritUi: 'bdd',
      ...options
    };

    Mocha.interfaces[name] = (rootSuite) => {
      Mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface(rootSuite, config);
    };

    const getters = ['get', 'def', 'subject', 'its', 'it', 'is', 'sharedExamplesFor', 'includeExamplesFor', 'itBehavesLike'];
    const defs = getters.reduce((all, uiName) => {
      all[uiName] = { get: () => global[uiName] };
      return all;
    }, {});

    return Object.defineProperties(Mocha.interfaces[name], defs);
  }
};

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

  rootSuite.afterEach(tracker.cleanUpCurrentContext);
  rootSuite.on('pre-require', (context) => {
    const ui = createLazyVarInterface(context, tracker, options);
    const describe = context.describe;

    Object.assign(context, ui);
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);
    context.context = context.describe;
    context.xdescribe = context.xcontext = context.describe.skip;
  });
}

module.exports = {
  createUi(name, options) {
    const config = Object.assign({
      Tracker: SuiteTracker,
      inheritUi: 'bdd'
    }, options);

    Mocha.interfaces[name] = (rootSuite) => {
      Mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface(rootSuite, config);
    };

    const getters = ['get', 'def', 'subject', 'sharedExamplesFor', 'includeExamplesFor', 'itBehavesLike'];
    const defs = getters.reduce((all, name) => {
      all[name] = { get: () => global[name] };
      return all;
    }, {});

    return Object.defineProperties(Mocha.interfaces[name], defs);
  }
};

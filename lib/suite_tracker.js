const lazyVar = require('./lazy_var');

class SuiteTracker {
  constructor(config = {}) {
    this.state = { currentlyDefinedSuite: config.rootSuite };
    this.currentContext = this.currentContext.bind(this);
    this.watcher = this.buildWatcher();
    this.testInterface = createTestInterface(config);
    this.cleanUp = lazyVar.cleanUp;
  }

  buildWatcher() {
    const self = this;

    return {
      registerSuite() {
        return self.registerSuite(this);
      },

      cleanUp() {
        return self.cleanUp(this);
      },

      cleanUpAndRestorePrev() {
        return self.cleanUpAndRestorePrev(this);
      }
    };
  }

  currentContext() {
    return this.state.currentTestContext;
  }

  get currentlyDefinedSuite() {
    return this.state.currentlyDefinedSuite;
  }

  wrapSuite(fn) {
    const self = this;

    return function detectSuite(title, defineTests, ...args) {
      return fn(title, function defineSuite(...testArgs) {
        const previousDefinedSuite = self.state.currentlyDefinedSuite;

        self.state.currentlyDefinedSuite = this;
        self.track(defineTests, this, testArgs);
        self.state.currentlyDefinedSuite = previousDefinedSuite;
      }, ...args);
    };
  }

  registerSuite(context) {
    this.state.prevTestContext = this.state.currentTestContext || null;
    this.state.currentTestContext = context;
  }

  cleanUpAndRestorePrev(context) {
    this.state.currentTestContext = this.state.prevTestContext;
    return this.cleanUp(context);
  }

  track(defineTests, suite, args) {
    const { registerSuite, cleanUp } = this.watcher;
    const { setup, teardown, setupSuite, teardownSuite } = this.testInterface;
    // TODO: callbacks count may be decreased.
    // In mocha.js it's possible to utilize reporter.suite || reporter.test
    // and in jasmine.js jasmine.getEnv().currentSpec
    setupSuite(registerSuite);
    setup(registerSuite);
    teardown(registerSuite);
    teardownSuite(registerSuite);
    defineTests.apply(suite, args);
    setupSuite(cleanUp);
    teardown(cleanUp);
    teardownSuite(cleanUp);
  }
}

function createTestInterface(options) {
  const state = {};

  return {
    get setupSuite() {
      return state.setupSuite = state.setupSuite || options.setupSuite || global.before;
    },

    get teardownSuite() {
      return state.teardownSuite = state.teardownSuite || options.teardownSuite || global.after;
    },

    get setup() {
      return state.setup = state.setup || options.setup || global.beforeEach;
    },

    get teardown() {
      return state.teardown = state.teardown || options.teardown || global.afterEach;
    }
  };
}

module.exports = SuiteTracker;

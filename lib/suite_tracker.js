const { Metadata } = require('./metadata');

const immediate = typeof setImmediate === 'function'
  ? setImmediate
  : (callback => setTimeout(callback, 0));

class SuiteTracker {
  constructor(config = {}) {
    this.state = { currentlyDefinedSuite: config.rootSuite };
  }

  get currentContext() {
    return this.state.currentTestContext;
  }

  get currentlyDefinedSuite() {
    return this.state.currentlyDefinedSuite;
  }

  wrapSuite(describe) {
    const tracker = this;

    return function detectSuite(title, defineTests, ...args) {
      return describe(title, function defineSuite(...testArgs) {
        const previousDefinedSuite = tracker.state.currentlyDefinedSuite;

        immediate(() => tracker.linkMetadataOf(this));
        tracker.state.currentlyDefinedSuite = this;
        tracker.track(defineTests, this, testArgs);
        tracker.state.currentlyDefinedSuite = previousDefinedSuite;
      }, ...args);
    };
  }

  linkMetadataOf(suite) {
    const metadata = Metadata.of(suite);
    const parentMetadata = Metadata.of(suite.parent);

    if (!parentMetadata) {
      return;
    }

    if (metadata) {
      parentMetadata.addChild(metadata);
    } else {
      Metadata.setVirtual(suite, parentMetadata);
    }
  }

  track(defineTests, suite, args) {
    const { registerSuite, cleanUp } = this.buildWatcherFor(suite);

    suite.beforeAll(registerSuite);
    suite.beforeEach(registerSuite);
    suite.afterEach(registerSuite);
    suite.afterAll(registerSuite);
    defineTests.apply(suite, args);

    if (Metadata.of(suite)) {
      suite.beforeAll(cleanUp);
      suite.afterEach(cleanUp);
      suite.afterAll(cleanUp);
    }
  }

  buildWatcherFor(suite) {
    return {
      registerSuite: this.registerSuite.bind(this, suite),
      cleanUp: this.cleanUp.bind(this, suite),
      cleanUpAndRestorePrev: this.cleanUpAndRestorePrev.bind(this, suite)
    };
  }

  registerSuite(context) {
    this.state.prevTestContext = this.state.currentTestContext || null;
    this.state.currentTestContext = context;
  }

  cleanUp(context) {
    const metadata = Metadata.of(context);

    if (metadata) {
      metadata.releaseVars();
    }
  }

  cleanUpAndRestorePrev(context) {
    this.state.currentTestContext = this.state.prevTestContext;
    return this.cleanUp(context);
  }
}

module.exports = SuiteTracker;

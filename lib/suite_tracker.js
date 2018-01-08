const { Metadata } = require('./metadata');

class SuiteTracker {
  constructor(config = {}) {
    this.state = { currentlyDefinedSuite: config.rootSuite };
    this.suiteTracker = config.suiteTracker || this.createSuiteTracker();
    this.suites = [];
  }

  createSuiteTracker() {
    return {
      before(tracker, suite) {
        suite.beforeAll(tracker.registerSuite);
      },

      after(tracker, suite) {
        suite.beforeAll(tracker.cleanUp);
        suite.afterEach(tracker.cleanUp);
        suite.afterAll(tracker.cleanUpAndRestorePrev);
      }
    }
  }

  get currentContext() {
    return this.state.currentTestContext;
  }

  get currentlyDefinedSuite() {
    return this.state.currentlyDefinedSuite;
  }

  wrapSuite(describe) {
    const tracker = this;

    return function detectSuite(title, defineTests, ...suiteArgs) {
      return describe(title, function defineSuite(...args) {
        tracker.trackSuite(this, defineTests, args)
      }, ...suiteArgs);
    };
  }

  trackSuite(suite, defineTests, args) {
    const previousDefinedSuite = this.state.currentlyDefinedSuite;

    this.state.currentlyDefinedSuite = suite;
    this.execute(defineTests, suite, args);
    this.state.currentlyDefinedSuite = previousDefinedSuite;
    this.suites.push(suite);

    if (this.isRoot(suite)) {
      this.linkParentToChildMetadataAndFlush();
    }
  }

  execute(defineTests, suite, args) {
    const tracker = this.buildRuntimeTrackerFor(suite);

    this.suiteTracker.before(tracker, suite);
    defineTests.apply(suite, args);

    if (Metadata.of(suite)) {
      this.suiteTracker.after(tracker, suite);
    }
  }

  buildRuntimeTrackerFor(suite) {
    return {
      registerSuite: this.registerSuite.bind(this, suite),
      cleanUp: this.cleanUp.bind(this, suite),
      cleanUpAndRestorePrev: this.cleanUpAndRestorePrev.bind(this, suite)
    };
  }

  isRoot(suite) {
    return !(suite.parent ? suite.parent.parent : suite.parentSuite.parentSuite);
  }

  linkParentToChildMetadataAndFlush() {
    this.suites.reverse().forEach(this.linkMetadataOf, this);
    this.suites.length = 0;
  }

  linkMetadataOf(suite) {
    const metadata = Metadata.of(suite);
    const parentMetadata = Metadata.of(suite.parent || suite.parentSuite);

    if (!parentMetadata) {
      return;
    }

    if (metadata) {
      parentMetadata.addChild(metadata);
    } else {
      Metadata.setVirtual(suite, parentMetadata);
    }
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

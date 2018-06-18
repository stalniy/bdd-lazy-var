const { Metadata } = require('./metadata');

class SuiteTracker {
  constructor(config = {}) {
    this.state = { currentlyDefinedSuite: config.rootSuite, contexts: [config.rootSuite] };
    this.suiteTracker = config.suiteTracker;
    this.suites = [];
    this.cleanUpCurrentContext = this.cleanUpCurrentContext.bind(this);
    this.cleanUpCurrentAndRestorePrevContext = this.cleanUpCurrentAndRestorePrevContext.bind(this);
  }

  get currentContext() {
    return this.state.contexts[this.state.contexts.length - 1];
  }

  get currentlyDefinedSuite() {
    return this.state.currentlyDefinedSuite;
  }

  wrapSuite(describe) {
    const tracker = this;

    return function detectSuite(title, defineTests, ...suiteArgs) {
      return describe(title, function defineSuite(...args) {
        tracker.trackSuite(this, defineTests, args);
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
    this.suiteTracker.before(this, suite);
    defineTests.apply(suite, args);

    if (Metadata.of(suite)) {
      this.suiteTracker.after(this, suite);
    }
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
    this.state.contexts.push(context);
  }

  cleanUp(context) {
    const metadata = Metadata.of(context);

    if (metadata) {
      metadata.releaseVars();
    }
  }

  cleanUpCurrentContext() {
    this.cleanUp(this.currentContext);
  }

  cleanUpCurrentAndRestorePrevContext() {
    this.cleanUpCurrentContext();
    this.state.contexts.pop();
  }
}

module.exports = SuiteTracker;

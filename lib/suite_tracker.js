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

    this.defineMetaFor(suite);
    this.state.currentlyDefinedSuite = suite;
    this.execute(defineTests, suite, args);
    this.state.currentlyDefinedSuite = previousDefinedSuite;
  }

  defineMetaFor(suite) {
    const meta = Metadata.ensureDefinedOn(suite);
    const parentMeta = Metadata.of(suite.parent || suite.parentSuite);

    if (parentMeta) {
      parentMeta.addChild(meta);
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

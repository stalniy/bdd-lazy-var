const SuiteTracker = require('../suite_tracker');

class RspecTracker extends SuiteTracker {
  track(defineTests, suite, args) {
    const { registerSuite, cleanUp, cleanUpAndRestorePrev } = this.buildWatcherFor(suite);

    suite.beforeAll(registerSuite);
    defineTests.apply(suite, args);
    suite.beforeAll(cleanUp);
    suite.afterEach(cleanUp);
    suite.afterAll(cleanUpAndRestorePrev);
  }
}

module.exports = RspecTracker;

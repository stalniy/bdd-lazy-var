const SuiteTracker = require('../suite_tracker');

class RspecTracker extends SuiteTracker {
  track(defineTests, suite, args) {
    const { setupSuite, teardown, teardownSuite } = this.testInterface;

    setupSuite(this.watcher.registerSuite);
    defineTests.apply(suite, args);
    setupSuite(this.watcher.cleanUp);
    teardown(this.watcher.cleanUp);
    teardownSuite(this.watcher.cleanUpAndRestorePrev);
  }
}

module.exports = RspecTracker;

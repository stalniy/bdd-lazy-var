var createTracker = require('../suite_tracker');

module.exports = function createRspecTracker(config) {
  var tracker = createTracker(config);

  tracker.track = function(runTests, suite, args, options) {
    options.setupSuite(tracker.registerSuite);
    runTests.apply(suite, args);
    options.setupSuite(tracker.cleanUp);
    options.teardown(tracker.cleanUp);
    options.teardownSuite(tracker.cleanUpAndRestorePrev);
  };

  return tracker;
}

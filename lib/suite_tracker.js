var lazyVar = require('./lazy_var');

function createOptions(options) {
  return {
    setupSuite: options.setupSuite || global.before,
    teardownSuite: options.teardownSuite || global.after,
    setup: options.setup || global.beforeEach,
    teardown: options.teardown || global.afterEach
  };
}

module.exports = function createSuiteTracker(config) {
  var state = { currentlyDefinedSuite: config.rootSuite };
  var options;

  return {
    cleanUp: function() {
      lazyVar.cleanUp(this);
    },

    registerSuite: function() {
      state.prevTestContext = state.currentTestContext || null;
      state.currentTestContext = this;
    },

    currentContext: function() {
      return state.currentTestContext;
    },

    currentlyDefinedSuite: function() {
      return state.currentlyDefinedSuite;
    },

    cleanUpAndRestorePrev: function() {
      state.currentTestContext = state.prevTestContext;
      lazyVar.cleanUp(this);
    },

    wrapSuite: function(fn) {
      var self = this;

      return function detectSuite(title, runTests) {
        return fn(title, function() {
          var previousDefinedSuite = state.currentlyDefinedSuite;

          state.currentlyDefinedSuite = this;
          options = options || createOptions(config);
          self.track(runTests, this, arguments, options);
          state.currentlyDefinedSuite = previousDefinedSuite;
        });
      };
    },

    track: function(runTests, suite, args, options) {
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec
      options.setupSuite(this.registerSuite);
      options.setup(this.registerSuite);
      options.teardown(this.registerSuite);
      options.teardownSuite(this.registerSuite);
      runTests.apply(suite, args);
      options.setupSuite(this.cleanUp);
      options.teardown(this.cleanUp);
      options.teardownSuite(this.cleanUp);
    }
  }
};

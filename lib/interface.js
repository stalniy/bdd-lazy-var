var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');
var Variable = require('./variable');

function cleanUp() {
  lazyVar.cleanUp(this);
}

function defaultOptions(options) {
  options.suite = options.suite || 'describe';
  options.setupSuite = options.setupSuite || 'before';
  options.teardownSuite = options.teardownSuite || 'after';
  options.setup = options.setup || 'beforeEach';
  options.teardown = options.teardown || 'afterEach';
  options.suiteTracking = options.suiteTracking || 'default';

  return options;
}

module.exports = function(context, state, options) {
  options = defaultOptions(options || {});

  var ui = {};
  var suiteTracker = {
    rspec: function(runTests, suite, args) {
      context[options.setupSuite](registerSuite);
      runTests.apply(suite, args);
      context[options.setupSuite](cleanUp);
      context[options.teardown](cleanUp);
      context[options.teardownSuite](cleanUpAndRestorePrev);
    },

    default: function(runTests, suite, args) {
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec
      context[options.setupSuite](registerSuite);
      context[options.setup](registerSuite);
      context[options.teardown](registerSuite);
      context[options.teardownSuite](registerSuite);
      runTests.apply(suite, args);
      context[options.setupSuite](cleanUp);
      context[options.teardown](cleanUp);
      context[options.teardownSuite](cleanUp);
    }
  };

  ui.subject = function(name, definition) {
    if (arguments.length === 1) {
      return ui.def('subject', name);
    } else if (arguments.length === 2) {
      return ui.def([name, 'subject'], definition);
    }

    return ui.get('subject');
  };

  ui.get = function(varName) {
    return Variable.evaluate(varName, { 'in': state.currentTestContext });
  };

  ui.def = function(varName, definition) {
    var suite = state.currentlyDefinedSuite;

    if (Array.isArray(varName)) {
      ui.def(varName[0], definition);
      return defineAliasesFor(suite, varName[0], varName.slice(1));
    }

    lazyVar.register(suite.ctx, varName, definition, getCurrentContext);
    detectParentDeclarationFor(suite, varName);
  };

  ui.get.definitionOf = ui.get.variable = function(varName) {
    return ui.get.bind(ui, varName);
  };

  ui.wrapTests = function(fn) {
    return function(title, runTests) {
      return fn(title, function() {
        var previousDefinedSuite = state.currentlyDefinedSuite;

        state.currentlyDefinedSuite = this;
        suiteTracker[options.suiteTracking](runTests, this, arguments);
        state.currentlyDefinedSuite = previousDefinedSuite;
      });
    };
  };

  function registerSuite() {
    state.prevTestContext = state.currentTestContext || null;
    state.currentTestContext = this;
  }

  function getCurrentContext() {
    return state.currentTestContext;
  }

  function cleanUpAndRestorePrev() {
    state.currentTestContext = state.prevTestContext;
    cleanUp.call(this);
  }

  function detectParentDeclarationFor(suite, varName) {
    if (suite.parent && lazyVar.isDefined(suite.parent.ctx, varName)) {
      lazyVar.metadataFor(suite.ctx, varName).parent = suite.parent.ctx;
    }

    if (typeof options.onDefineVariable === 'function') {
      options.onDefineVariable(suite, varName, context);
    }
  }

  function defineAliasesFor(suite, varName, aliases) {
    aliases.forEach(function(alias) {
      lazyVar.registerAlias(suite.ctx, varName, alias);
      detectParentDeclarationFor(suite, alias);
    });
  }

  return ui;
};

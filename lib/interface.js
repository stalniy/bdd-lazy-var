var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');

var noop = function() {};
var currentlyRetrievedVarField = Symbol.for('__definesVariable');
var parentDefinitionsField = Symbol.for('__parentContextForLazyVars');

function cleanUp() {
  lazyVar.cleanUp(this);
}

function registerParentContextFor(varName, suite) {
  if (!suite.ctx.hasOwnProperty(parentDefinitionsField)) {
    suite.ctx[parentDefinitionsField] = {};
  }

  suite.ctx[parentDefinitionsField][varName] = suite.parent.ctx;
}

function getParentContextFor(varName, testContext) {
  if (!testContext[parentDefinitionsField]) {
    throw new Error('Unknown parent variable "' + varName + '".');
  }

  return testContext[parentDefinitionsField][varName];
}

function defaultOptions(options) {
  options.suite = options.suite || 'describe';
  options.setupSuite = options.setupSuite || 'before';
  options.teardownSuite = options.teardownSuite || 'after';
  options.setup = options.setup || 'beforeEach';
  options.teardown = options.teardown || 'afterEach';
  options.onDefine = options.onDefine || noop;

  return options;
}

module.exports = function(context, state, options) {
  options = defaultOptions(options || {});

  context.subject = function(definition) {
    return arguments.length === 1 ? context.def('subject', definition) : context.get('subject');
  };

  context.get = function(varName) {
    var originalSuite = state.currentTestContext;

    if (varName === state.currentTestContext[currentlyRetrievedVarField]) {
      state.currentTestContext = getParentContextFor(varName, originalSuite);
    }

    try {
      state.currentTestContext[currentlyRetrievedVarField] = varName;

      return state.currentTestContext[varName];
    } finally {
      delete state.currentTestContext[currentlyRetrievedVarField];
      state.currentTestContext = originalSuite;
    }
  };

  context.def = function(varName, definition) {
    var suite = state.currentlyDefinedSuite;

    if (suite.parent && lazyVar.isDefined(suite.parent.ctx, varName)) {
      registerParentContextFor(varName, suite);
    }

    lazyVar.register(suite.ctx, varName, typeof definition === 'function' ? wrapDefs(definition) : definition);
    options.onDefine(suite, { name: varName, get: context.get.variable(varName) }, context);
  };

  context.get.definitionOf = context.get.variable = function(varName) {
    return context.get.bind(context, varName);
  };

  var suite = context[options.suite];
  context[options.suite] = function(title, runTests) {
    return suite(title, function() {
      var previousDefinedSuite = state.currentlyDefinedSuite;

      state.currentlyDefinedSuite = this;
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec
      context[options.setupSuite](registerSuite);
      context[options.setup](registerSuite);
      context[options.teardown](registerSuite);
      context[options.teardownSuite](registerSuite);
      runTests.apply(this, arguments);
      context[options.setupSuite](cleanUp);
      context[options.teardown](cleanUp);
      context[options.teardownSuite](cleanUp);
      state.currentlyDefinedSuite = previousDefinedSuite;
    });
  };

  function registerSuite() {
    state.currentTestContext = this;
  }

  function wrapDefs(definition) {
    return function() {
      return definition.call(state.currentTestContext);
    };
  }
};

var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');

var currentlyRetrievedVarField = Symbol.for('__definesVariable');

function cleanUp() {
  lazyVar.cleanUp(this);
}

function getParentContextFor(varName, testContext) {
  var metadata = lazyVar.metadataFor(testContext, varName);

  if (!metadata || !metadata.parent) {
    throw new Error('Unknown parent variable "' + varName + '".');
  }

  return metadata.parent;
}

function defaultOptions(options) {
  options.suite = options.suite || 'describe';
  options.setupSuite = options.setupSuite || 'before';
  options.teardownSuite = options.teardownSuite || 'after';
  options.setup = options.setup || 'beforeEach';
  options.teardown = options.teardown || 'afterEach';

  return options;
}

function VariableContext(varName) {
  this.name = varName
  this.context = null
}

VariableContext.EMPTY = new VariableContext()

module.exports = function(context, state, options) {
  options = defaultOptions(options || {});

  context.subject = function(name, definition) {
    if (arguments.length === 1) {
      return context.def('subject', name);
    } else if (arguments.length === 2) {
      context.def(name, definition);

      return context.def('subject', context.get.variable(name));
    }

    return context.get('subject');
  };

  context.get = function(varName) {
    var context = state.currentTestContext
    var variable = context[currentlyRetrievedVarField] || VariableContext.EMPTY;

    if (varName === variable.name) {
      var parentContext = getParentContextFor(varName, variable.context || context);

      variable.context = parentContext;

      return parentContext[varName];
    }

    try {
      context[currentlyRetrievedVarField] = new VariableContext(varName);

      return context[varName];
    } finally {
      delete context[currentlyRetrievedVarField];
    }
  };

  context.def = function(varName, definition) {
    var suite = state.currentlyDefinedSuite;

    lazyVar.register(suite.ctx, varName, definition, getCurrentContext);

    if (suite.parent && lazyVar.isDefined(suite.parent.ctx, varName)) {
      lazyVar.metadataFor(suite.ctx, varName).parent = suite.parent.ctx
    }

    if (typeof options.onDefineVariable === 'function') {
      options.onDefineVariable(suite, varName, context);
    }
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

  function getCurrentContext() {
    return state.currentTestContext;
  }
};

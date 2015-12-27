var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');

var currentlyRetrievedVarField = Symbol.for('__definesVariable');
var parentDefinitionsField = Symbol.for('__parentContextForLazyVars');
var isExecutedField = Symbol.for('__isExecuted');

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

module.exports = function(context, state, options) {

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

    return lazyVar.register(suite.ctx, varName, definition);
  };

  context.get.definitionOf = context.get.variable = function(varName) {
    return context.get.bind(context, varName);
  };

  var describe = context.describe;
  context.describe = function(title, runTests) {
    return describe(title, function() {
      var previousDefinedSuite = state.currentlyDefinedSuite;

      state.currentlyDefinedSuite = this;
      context.before(registerSuite);
      context.beforeEach(registerSuite);
      context.afterEach(registerSuite);
      context.after(registerSuite);
      runTests.apply(this, arguments);
      context.before(cleanUp);
      context.afterEach(cleanUp);
      context.after(cleanUp);
      state.currentlyDefinedSuite = previousDefinedSuite;
    });
  };

  function registerSuite() {
    state.currentTestContext = this;
  }
};

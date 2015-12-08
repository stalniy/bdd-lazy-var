var Mocha = require('mocha');
var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');

var currentlyRetrievedVarField = Symbol.for('__definesVariable');
var parentDefinitionsField = Symbol.for('__parentContextForLazyVars');
var isExecutedField = Symbol.for('__isExecuted');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  var currentlyDefinedSuite = rootSuite;
  var currentTestContext;

  Mocha.interfaces.bdd(rootSuite);
  rootSuite.on('pre-require', function(context) {
    context.subject = function(definition) {
      return arguments.length === 1 ? context.def('subject', definition) : context.get('subject');
    };

    context.get = function(varName) {
      var originalSuite = currentTestContext;

      if (varName === currentTestContext[currentlyRetrievedVarField]) {
        currentTestContext = getParentContextFor(varName, originalSuite);
      }

      try {
        currentTestContext[currentlyRetrievedVarField] = varName;

        return currentTestContext[varName];
      } finally {
        delete currentTestContext[currentlyRetrievedVarField];
        currentTestContext = originalSuite;
      }
    };

    context.def = function(varName, definition) {
      var suite = currentlyDefinedSuite;

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
        currentlyDefinedSuite = this;

        context.before(registerSuite);
        context.beforeEach(registerSuite);
        context.afterEach(registerSuite);
        context.after(registerSuite);
        runTests.apply(this, arguments);
        context.afterEach(cleanUp);
        context.after(cleanUp);

        currentlyDefinedSuite = null;
      });
    };

    function registerSuite() {
      currentTestContext = this;
    }

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

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

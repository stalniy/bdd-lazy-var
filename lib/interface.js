var Mocha = require('mocha');
var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');

var currentlyDefinedVarField = Symbol.for('_definesVariable');
var parentDefinitionsField = Symbol.for('_parentContextForLazyVars');

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

      if (varName === currentTestContext[currentlyDefinedVarField]) {
        currentTestContext = getParentContextFor(varName, currentTestContext);
      }

      try {
        currentTestContext[currentlyDefinedVarField] = varName;

        return lazyVar.getOrCreate(currentTestContext, varName);
      } finally {
        delete currentTestContext[currentlyDefinedVarField];
        currentTestContext = originalSuite;
      }
    };

    context.def = function(varName, definition) {
      if (lazyVar.isDefined(currentlyDefinedSuite.ctx, varName)) {
        registerParentContextFor(varName, currentlyDefinedSuite);
      }

      return lazyVar.register(currentlyDefinedSuite.ctx, varName, definition);
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
        context.afterEach(lazyVar.cleanUp);
        context.after(lazyVar.cleanUp);

        currentlyDefinedSuite = null;
      });
    };

    function registerSuite() {
      currentTestContext = this;
    }

    function registerParentContextFor(varName, suite) {
      if (!suite.ctx.hasOwnProperty(parentDefinitionsField)) {
        suite.ctx[parentDefinitionsField] = {};
      }

      suite.ctx[parentDefinitionsField][varName] = suite.parent.ctx;
    }

    function getParentContextFor(varName, testContext) {
      return testContext[parentDefinitionsField] ? testContext[parentDefinitionsField][varName] : null;
    }

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

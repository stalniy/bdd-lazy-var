var Mocha = require('mocha');
var lazyVar = require('./lazy_var');

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

      if (varName === currentTestContext._definesVariable) {
        currentTestContext = getParentContextFor(varName, currentTestContext);
      }

      try {
        currentTestContext._definesVariable = varName;

        return lazyVar.getOrCreate(currentTestContext, varName);
      } finally {
        delete currentTestContext._definesVariable;
        currentTestContext = originalSuite;
      }
    };

    context.def = function(varName, definition) {
      if (lazyVar.isDefined(currentlyDefinedSuite.ctx, varName)) {
        registerParentContextFor(varName, currentlyDefinedSuite);
      }

      return lazyVar.register(currentlyDefinedSuite.ctx, varName, definition);
    };

    var describe = context.describe;
    context.describe = function(title, runTests) {
      return describe(title, function() {
        currentlyDefinedSuite = this;

        context.before(function() {
          this.title = title;
        });

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
      if (!suite.ctx.hasOwnProperty('_parentContextForLazyVars')) {
        suite.ctx._parentContextForLazyVars = {};
      }

      suite.ctx._parentContextForLazyVars[varName] = suite.parent.ctx;
    }

    function getParentContextFor(varName, testContext) {
      return testContext._parentContextForLazyVars ? testContext._parentContextForLazyVars[varName] : null;
    }

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

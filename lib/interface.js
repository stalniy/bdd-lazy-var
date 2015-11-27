var Mocha = require('mocha');
var lazyVar = require('./lazy_var');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  var currentlyDefinedSuite = rootSuite;
  var currentlyRetrievedVarName;
  var currentlyRunningSuite = null;

  Mocha.interfaces.bdd(rootSuite);
  rootSuite.on('pre-require', function(context, file, mocha) {
    context.subject = function(definition) {
      return arguments.length === 1 ? context.def('subject', definition) : context.get('subject');
    };

    context.get = function(name) {
      var originalSuite = currentlyRunningSuite;

      if (name === currentlyRetrievedVarName) {
        currentlyRunningSuite = Object.getPrototypeOf(originalSuite);
      }

      try {
        currentlyRetrievedVarName = name;

        // console.log('get "%s" for "%s"', name, currentlyRunningSuite.title);

        return lazyVar.getOrCreate(currentlyRunningSuite, name);
      } finally {
        currentlyRetrievedVarName = null;
        currentlyRunningSuite = originalSuite;

        // console.log('restore to "%s"', currentlyRunningSuite.title);
      }
    };

    context.def = function(name, definition) {
      return lazyVar.register(currentlyDefinedSuite.ctx, name, definition);
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
      currentlyRunningSuite = this;
    }

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

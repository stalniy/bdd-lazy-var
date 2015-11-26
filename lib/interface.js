var Mocha = require('mocha');
var lazyVar = require('./lazy_var');

module.exports = Mocha.interfaces['bdd+lazy-var'] = function(rootSuite) {
  var currentSuite = rootSuite;

  Mocha.interfaces.bdd(rootSuite);

  rootSuite.on('pre-require', function(context, file, mocha) {
    var currentlyDefinedSuite, currentlyRetrievedVarName, currentlyRunningSuites = [];

    context.subject = function(definition) {
      return arguments.length === 1 ? def('subject', definition) : get('subject');
    };

    context.get = function(name) {
      if (name === currentlyRetrievedVarName) {
        currentlyRunningSuites.index--;
      }

      try {
        currentlyRetrievedVarName = name;

        return lazyVar.getOrCreate(currentlyRunningSuites[currentlyRunningSuites.index], name);
      } finally {
        currentlyRetrievedVarName = null;
        currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
      }
    };

    context.def = function(name, definition) {
      return lazyVar.register(currentlyDefinedSuite.ctx, name, definition);
    };

    var describe = context.describe;
    context.describe = function(title, runTests) {
      return describe(title, function() {
        currentlyDefinedSuite = this;

        before(function() {
          currentlyRunningSuites.push(this);
          currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
        });

        runTests.apply(this, arguments);

        context.afterEach(lazyVar.cleanUp);
        after(function() {
          if (currentlyRunningSuites.length > 0) {
            currentlyRunningSuites.pop();
            currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
          }
        });
      });
    };

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

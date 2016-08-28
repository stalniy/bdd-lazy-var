var Mocha = require('mocha');
var injectLazyVarInterface = require('../interface');

function addInterface(rootSuite, options) {
  var state = { currentlyDefinedSuite: rootSuite };

  rootSuite.on('pre-require', function(context) {
    var describe = context.describe;

    injectLazyVarInterface(context, state, options);
    context.describe.skip = function(title, fn) {
      return describe.skip(title, function() {
        state.currentlyDefinedSuite = this;
        fn.apply(this, arguments);
      });
    };
    context.context = context.describe;
    context.context.only = context.describe.only = describe.only;
    context.xdescribe = context.xcontext = context.context.skip = context.describe.skip;
  });
}

module.exports = {
  createUi: function(name, options) {
    options = options || {};
    options.inheritUi = options.inheritUi || 'bdd';

    return Mocha.interfaces[name] = function(rootSuite) {
      Mocha.interfaces[options.inheritUi](rootSuite);
      return addInterface(rootSuite, options);
    };
  }
};

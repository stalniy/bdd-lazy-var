var Mocha = require('mocha');
var injectLazyVarInterface = require('../interface');

function addInterface(rootSuite, options) {
  var state = { currentlyDefinedSuite: rootSuite };

  rootSuite.on('pre-require', function(context) {
    var describe = context.describe;

    injectLazyVarInterface(context, state, options);
    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
}

module.exports = {
  createUi: function(name, options) {
    options = options || {};
    options.inheritUi = options.inheritUi || 'bdd';

    var ui = Mocha.interfaces[name] = function(rootSuite) {
      Mocha.interfaces[options.inheritUi](rootSuite);

      return addInterface(rootSuite, options);
    };

    return ui;
  }
};

var Mocha = require('mocha');
var injectLazyVarInterface = require('../interface');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  Mocha.interfaces.bdd(rootSuite);

  var state = { currentlyDefinedSuite: rootSuite };
  rootSuite.on('pre-require', function(context) {
    injectLazyVarInterface(context, state);

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

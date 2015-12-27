var injectLazyVarInterface = require('../interface');

module.exports = function(rootSuite, options) {
  var state = { currentlyDefinedSuite: rootSuite };

  rootSuite.on('pre-require', function(context) {
    var describe = context.describe;

    injectLazyVarInterface(context, state, options);
    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

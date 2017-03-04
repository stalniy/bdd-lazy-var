var Mocha = require('mocha');
var createLazyVarInterface = require('../interface');

function addInterface(rootSuite, options) {
  var state = { currentlyDefinedSuite: rootSuite };

  rootSuite.on('pre-require', function(context) {
    var ui = createLazyVarInterface(context, state, options);
    var describe = context.describe;

    context.def = ui.def;
    context.get = ui.get;
    context.subject = ui.subject;
    context.describe = ui.wrapTests(describe);
    context.describe.skip = ui.wrapTests(describe.skip);
    context.describe.only = ui.wrapTests(describe.only);

    context.context = context.describe;
    context.context.only = context.describe.only;
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

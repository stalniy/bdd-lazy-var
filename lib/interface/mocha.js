var Mocha = require('mocha');
var createLazyVarInterface = require('../interface');
var createTracker = require('../suite_tracker');

function addInterface(rootSuite, tracker, options) {
  rootSuite.on('pre-require', function(context) {
    var ui = createLazyVarInterface(context, tracker, options);
    var describe = context.describe;

    context.def = ui.def;
    context.get = ui.get;
    context.subject = ui.subject;
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);

    context.context = context.describe;
    context.context.only = context.describe.only;
    context.xdescribe = context.xcontext = context.context.skip = context.describe.skip;
  });
}

module.exports = {
  createUi: function(name, options) {
    var config = options || {};
    var buildTracker = config.createTracker || createTracker;
    config.inheritUi = config.inheritUi || 'bdd';

    return Mocha.interfaces[name] = function(rootSuite) {
      Mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface(rootSuite, buildTracker({ rootSuite: rootSuite }), config);
    };
  }
};

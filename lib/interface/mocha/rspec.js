var interfaceBuilder = require('../mocha');
var defineGetterOnce = require('../../define_var');
var createRspecTracker = require('../../suite_tracker/rspec');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/rspec', {
  createTracker: createRspecTracker,
  onDefineVariable: function(suite, varName, context) {
    defineGetterOnce(context, varName, { getterPrefix: '$' });
  }
});

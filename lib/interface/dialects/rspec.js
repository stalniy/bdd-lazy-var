const interfaceBuilder = require('../index');
const defineGetterOnce = require('../../define_var');
const RspecTracker = require('../../suite_tracker/rspec');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/rspec', {
  Tracker: RspecTracker,
  onDefineVariable(suite, varName, context) {
    defineGetterOnce(context, varName, { getterPrefix: '$' });
  }
});

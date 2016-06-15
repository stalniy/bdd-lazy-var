var interfaceBuilder = require('../mocha');
var defineGetterOnce = require('../../define_var');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/global', {
  onDefineVariable: function(suite, varName, context) {
    defineGetterOnce(context, varName, { getterPrefix: '$' });
  }
});

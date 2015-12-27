var interfaceBuilder = require('../mocha');
var defineVariableOnce = require('../../define_var');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/getter', {
  onDefine: function(suite, variable, context) {
    defineVariableOnce.for(suite, variable, context.get);
  }
});

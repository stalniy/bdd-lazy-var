var interfaceBuilder = require('../mocha');
var defineGetterOnce = require('../../define_var');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/getter', {
  onDefineVariable: function(suite, varName, context) {
    defineGetterOnce(context, varName, { defineOn: context.get });
  }
});

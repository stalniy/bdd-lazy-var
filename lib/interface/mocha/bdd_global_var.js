var interfaceBuilder = require('../mocha');
var defineVariableOnce = require('../../define_var');
var varPrefix = '$';

module.exports = interfaceBuilder.createUi('bdd-lazy-var/global', {
  onDefine: function(suite, variable, context) {
    variable.originalName = variable.name
    variable.name = varPrefix + variable.name;

    defineVariableOnce.for(suite, variable, context);
  }
});

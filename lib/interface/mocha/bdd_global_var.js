var Mocha = require('mocha');
var addInterface = require('../mocha');
var defineVariableOnce = require('../../define_var');
var varPrefix = '$';

function defineVariableOnContext(suite, variable, context) {
  defineVariableOnce(context, { name: varPrefix + variable.name, get: variable.get });
  suite.afterAll(function() {
    delete context[varPrefix + variable.name];
  });
}

module.exports = Mocha.interfaces['bdd-lazy-global-var'] = function(rootSuite) {
  Mocha.interfaces.bdd(rootSuite);

  return addInterface(rootSuite, { onDefine: defineVariableOnContext });
};

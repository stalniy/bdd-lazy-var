var Mocha = require('mocha');
var addInterface = require('../mocha');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  Mocha.interfaces.bdd(rootSuite);

  return addInterface(rootSuite);
};

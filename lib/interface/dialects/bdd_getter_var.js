const interfaceBuilder = require('../index');
const defineGetterOnce = require('../../define_var');

module.exports = interfaceBuilder.createUi('bdd-lazy-var/getter', {
  onDefineVariable(suite, varName, context) {
    defineGetterOnce(context, varName, { defineOn: context.get });
  }
});

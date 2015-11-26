var chai = require('chai');
var Mocha = require('mocha');

chai.use(require('chai-spies'));
require('..');

global.expect = chai.expect;
global.spy = chai.spy;

var mocha = new Mocha({
  reporter: 'spec',
  ui: 'bdd-lazy-var'
});

mocha.addFile(__dirname + '/interface_spec.js');
mocha.run();

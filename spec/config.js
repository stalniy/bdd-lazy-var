var chai = require('chai');

chai.use(require('chai-spies'));
require('..');

global.expect = chai.expect;
global.spy = chai.spy;

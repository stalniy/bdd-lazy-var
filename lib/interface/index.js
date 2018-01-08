let Mocha;

try {
  Mocha = require('mocha'); // eslint-disable-line
} catch (e) {
  // eslint-disable-line
}

let ui;

if (global.jasmine) {
  ui = require('./jasmine');
} else if (Mocha) {
  ui = require('./mocha');
}

if (!ui) {
  throw new Error(`
    Unable to detect testing framework. Make sure that
      * jasmine or mocha is installed
      * bdd-lazy-var is included after "jasmine" or "mocha"
  `);
}

module.exports = ui;

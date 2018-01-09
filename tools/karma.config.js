const path = require('path');

module.exports = function(config) {
  const specs = (config.specs || '').split(',');
  const srcFiles = (config.src || '').split(',');
  const frameworks = (config.f || 'mocha').split(',');

  srcFiles.unshift(
    'node_modules/chai/chai.js',
    'node_modules/chai-spies/chai-spies.js',
    'spec/config.js'
  );
  specs.unshift(
    'spec/interface_examples.js',
    'spec/default_suite_tracking_examples.js'
  );

  config.set({
    frameworks,
    basePath: '..',
    transports: [ 'xhr-polling', 'polling' ],
    reporters: [ 'dots' ],
    port: 9876,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    browsers: [ 'Firefox' ],
    files: frameworks.includes('mocha') ? specs : srcFiles.concat(specs),
    client: {
      mocha: {
        ui: config.u,
        require: srcFiles.reverse().map(filePath => path.resolve(filePath))
      }
    }
  });
}

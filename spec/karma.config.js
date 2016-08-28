var path = require('path');

module.exports = function(config) {
  var specs = (config.specs || '').split(',');
  var srcFiles = (config.src || '').split(',');

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
    basePath: '..',
    frameworks: [ 'mocha' ],
    transports: [ 'xhr-polling', 'polling' ],
    reporters: [ 'dots' ],
    port: 9876,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    browsers: [ 'Firefox' ],
    files: specs,
    client: {
      mocha: {
        ui: config.u,
        require: srcFiles.reverse().map(function(filePath) {
          return path.resolve(filePath);
        })
      }
    }
  });
}

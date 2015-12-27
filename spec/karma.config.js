var karmaMocha = require('karma-mocha');
var initMocha = karmaMocha['framework:mocha'][1];

karmaMocha['framework:mocha'][1] = function(files) {
  initMocha.apply(this, arguments);
  files.splice(1, 1);
};

karmaMocha['framework:mocha'][1].$inject = [ 'config.files', 'config.client.mocha' ];

module.exports = function(config) {
  var specs = (config.specs || '').split(',');
  var srcFiles = (config.src || '').split(',');

  srcFiles.push(require.resolve('karma-mocha/lib/adapter'));
  srcFiles.unshift(
    'node_modules/chai/chai.js',
    'node_modules/chai-spies/chai-spies.js',
    'spec/config.js'
  );
  specs.unshift('spec/interface_examples.js');

  config.set({
    basePath: '..',
    frameworks: [ 'mocha' ],
    reporters: [ 'dots' ],
    port: 9876,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    browsers: [ 'Firefox' ],
    files: srcFiles.concat(specs),
    client: {
      mocha: {
        ui: config.u
      }
    }
  });
}

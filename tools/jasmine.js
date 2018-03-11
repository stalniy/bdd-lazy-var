const JasmineCli = require('jasmine');

const jasmine = new JasmineCli();
const helpers = [
  '../spec/config',
  `../${process.argv[2]}`
];

helpers.forEach(require);
jasmine.loadConfig({
  spec_dir: 'spec',
  spec_files: [
    'interface_examples.js',
    'default_suite_tracking_examples.js',
    'shared_behavior_spec.js'
  ].concat(process.argv.slice(3)),
});

jasmine.execute();

const uiFile = process.env.SRC_FILE;

require('../spec/config');
require(`../${uiFile}`);
require('../spec/interface_examples');
require('../spec/default_suite_tracking_examples');
require('../spec/shared_behavior_spec');

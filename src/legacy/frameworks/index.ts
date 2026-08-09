import type { CreateUIOptions } from "../createUI";
import { SuiteTracker } from "../SuiteTracker";

let uiBuilder: {
  createFrameworkUI(name: string, options?: CreateUIOptions & { Tracker?: typeof SuiteTracker }): unknown;
} | undefined;

try {
  require('mocha'); // eslint-disable-line
  uiBuilder = require('./mocha');
} catch {
  if (typeof jest !== 'undefined') {
    uiBuilder = require('./jasmine'); // eslint-disable-line
  } else if (global.jasmine) {
    uiBuilder = require('./jasmine');  // eslint-disable-line
  }
}

if (!uiBuilder) {
  throw new Error(`
    Unable to detect testing framework. Make sure that
      * jest, jasmine or mocha is installed
      * bdd-lazy-var is included after "jasmine" or "mocha"
  `);
}

export const builder = uiBuilder as Exclude<typeof uiBuilder, undefined>;

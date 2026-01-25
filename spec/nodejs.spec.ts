import { before, after, beforeEach, afterEach, it, describe } from "node:test";

import { includeLazyVarsInterfaceExamples, type TestFrameworkApi } from "./interface_examples.ts";
import '../src/extensions/nodejs.ts';

includeLazyVarsInterfaceExamples({
  before,
  after,
  beforeEach,
  afterEach,
  it,
  describe: describe as TestFrameworkApi['describe'],
});

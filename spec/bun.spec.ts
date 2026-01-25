import { beforeAll, afterAll, beforeEach, afterEach, it, describe } from "bun:test";

import { includeLazyVarsInterfaceExamples, type TestFrameworkApi } from "./interface_examples.ts";
import '../src/extensions/bun.ts';

includeLazyVarsInterfaceExamples({
  before: beforeAll,
  after: afterAll,
  beforeEach,
  afterEach,
  it,
  describe: describe as TestFrameworkApi['describe'],
});

import { beforeAll, afterAll, beforeEach, afterEach, it, describe } from "vitest";

import { includeLazyVarsInterfaceExamples, type TestFrameworkApi } from "./interface_examples.ts";
import '../src/extensions/vitest.ts';

includeLazyVarsInterfaceExamples({
  before: beforeAll,
  after: afterAll,
  beforeEach,
  afterEach,
  it,
  describe: describe as TestFrameworkApi['describe'],
});

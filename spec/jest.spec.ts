import { beforeAll, afterAll, beforeEach, afterEach, it, describe } from "@jest/globals";

import { includeLazyVarsInterfaceExamples, type TestFrameworkApi } from "./interface_examples.ts";
import '../src/extensions/jest.ts';

includeLazyVarsInterfaceExamples({
  before: beforeAll,
  after: afterAll,
  beforeEach,
  afterEach,
  it,
  describe: describe as TestFrameworkApi['describe'],
});

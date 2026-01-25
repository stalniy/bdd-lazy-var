import { includeLazyVarsInterfaceExamples, type TestFrameworkApi } from "./interface_examples.ts";
import '../src/extensions/bdd.ts';

includeLazyVarsInterfaceExamples({
  before: beforeAll,
  after: afterAll,
  beforeEach,
  afterEach,
  it,
  describe: describe as TestFrameworkApi['describe'],
});

import { before, after, beforeEach, afterEach, it, describe } from "mocha";
import { includeLazyVarsInterfaceExamples } from "./interface_examples.ts";
import '../src/extensions/mocha.ts';

includeLazyVarsInterfaceExamples({
  before,
  after,
  beforeEach,
  afterEach,
  it,
  describe,
});

import { before, after, beforeEach, afterEach, it, describe } from "mocha";
import { includeLazyVarsInterfaceExamples } from "./interface_examples.ts";
import { setup } from "../src/setup.ts";
import chai from "chai";
import spies from "chai-spies";

chai.use(spies);

const expect = chai.expect;
const spy = chai.spy;

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
})

includeLazyVarsInterfaceExamples({
  before,
  after,
  beforeEach,
  afterEach,
  it,
  describe,
  spy,
  expect,
});

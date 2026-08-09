import * as chai from "chai";
import spies from "chai-spies";

const { expect, spy } = chai.use(spies);

globalThis.expect = expect;
globalThis.spy = spy;

export { expect, spy };

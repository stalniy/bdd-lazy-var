import { setup } from "../setup.ts";
import { beforeEach, afterEach } from "mocha";

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

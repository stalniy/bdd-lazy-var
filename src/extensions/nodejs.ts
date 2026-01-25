import { setup } from "../setup.ts";
import { beforeEach, afterEach } from "node:test";

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

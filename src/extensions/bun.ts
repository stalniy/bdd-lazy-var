import { setup } from "../setup.ts";
import { beforeEach, afterEach } from "bun:test";

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

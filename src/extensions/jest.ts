import { setup } from "../setup.ts";
import { beforeEach, afterEach } from "@jest/globals";

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

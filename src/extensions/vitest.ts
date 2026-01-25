import { setup } from "../setup.ts";
import { beforeEach, afterEach } from "vitest";

setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

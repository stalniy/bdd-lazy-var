import { setup } from "../setup.ts";

// Supports mocha, jasmine and jest when helpers are globally defined
setup({
  registerCleanup: (cleanup) => {
    beforeEach(cleanup);
    afterEach(cleanup);
  }
});

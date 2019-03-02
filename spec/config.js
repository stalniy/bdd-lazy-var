(function (factory) {
  if (typeof require === 'function' && typeof module !== 'undefined') {
    require('chai').use(require('chai-spies')); // eslint-disable-line
    factory(require('chai'), this); // eslint-disable-line
  } else if (typeof window === 'object') {
    window.global = window;
    factory(window.chai, window);
  }
}((chai, global) => {
  global.expect = chai.expect;
  global.spy = chai.spy;

  if (global.beforeAll) {
    global.before = global.beforeAll;
  }

  if (global.afterAll) {
    global.after = global.afterAll;
  }
}));

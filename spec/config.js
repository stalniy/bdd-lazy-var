(function(factory) {
  if (typeof require === 'function' && typeof module !== 'undefined') {
    require('chai').use(require('chai-spies'));
    factory(require('chai'), this);
  } else if (typeof window === 'object') {
    window.global = window;
    factory(window.chai, window);
  }
})(function(chai, global) {
  global.expect = chai.expect;
  global.spy = chai.spy;

  var examples = {};
  global.sharedExamplesFor = function(name, defs) {
    examples[name] = defs;
  };

  global.includeExamplesFor = function(name) {
    examples[name].apply(this, Array.prototype.slice.call(arguments, 1));
  };

  if (global.beforeAll) {
    global.before = global.beforeAll;
  }

  if (global.afterAll) {
    global.after = global.afterAll;
  }
});

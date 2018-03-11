const SHARED_EXAMPLES = {};

function sharedExamplesFor(name, defs) {
  if (SHARED_EXAMPLES[name]) {
    throw new Error(`Attempt to override "${name}" shared example`);
  }

  SHARED_EXAMPLES[name] = defs;
}

function includeExamplesFor(name, ...args) {
  if (!SHARED_EXAMPLES.hasOwnProperty(name)) {
    throw new Error(`Attempt to include not defined shared behavior "${name}"`);
  }

  SHARED_EXAMPLES[name].apply(null, args);
}

function itBehavesLike(name, ...args) {
  global.describe(`behaves like ${name}`, () => {
    includeExamplesFor(name, ...args);
  });
}

module.exports = {
  sharedExamplesFor,
  includeExamplesFor,
  itBehavesLike
};

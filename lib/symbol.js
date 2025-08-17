const identity = (x) => x;

module.exports = {
  for: typeof Symbol === 'undefined' ? identity : Symbol.for
};

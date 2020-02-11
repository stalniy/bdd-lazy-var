const indentity = (x) => x;

module.exports = {
  for: typeof Symbol === 'undefined' ? indentity : Symbol.for
};

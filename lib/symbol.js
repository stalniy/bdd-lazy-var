var indentity = function(value) {
  return value;
};

module.exports = {
  for: typeof Symbol === 'undefined' ? indentity : Symbol.for
};

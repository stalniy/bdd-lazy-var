module.exports = function parseMessage(fn) {
  const matches = fn.toString().match(/is\.expected\.(\s+(?=\.)|.)+/g);

  if (!matches) {
    return '';
  }

  const prefixLength = 'is.expected.'.length;
  const body = matches.reduce((message, chunk) => message.concat(chunk.trim()
    .slice(prefixLength)
    .replace(/[\s.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, (_, before, letter) => `${before} ${letter.toLowerCase()}`)
    .replace(/ and /g, ', ')), []);

  return `is expected ${body.join(', ')}`;
};

function parseMessage(fn) {
  const matches = fn.toString().match(/is\.expected\.(\s+(?=\.)|.)+/g);

  if (!matches) {
    return '';
  }

  const prefixLength = 'is.expected.'.length;
  const body = matches.reduce((message, chunk) => {
    const cleanChunk = chunk.trim()
      .slice(prefixLength)
      .replace(/[\s.]+/g, ' ');
    const humanized = humanize(cleanChunk).replace(/ and /g, ', ');
    message.push(humanized);
    return message;
  }, []);

  return `is expected ${body.join(', ')}`;
}

function humanize(value) {
  return value.replace(
    /([a-z])([A-Z])/g,
    (_, before, letter) => `${before} ${letter.toLowerCase()}`
  );
}

module.exports = {
  parseMessage,
  humanize,
};

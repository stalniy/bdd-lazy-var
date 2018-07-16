includeExamplesFor('Root Lazy Vars', get);

describe('Lazy variables interface', function() {
  includeExamplesFor('Lazy Vars Interface', get);
  includeExamplesFor('Default suite tracking', get);

  describe('`it` without message', function() {
    subject(function() {
      return {
        items: [1, 2, 3]
      };
    });

    it(() => is.expected.to.be.an('object'));

    it(() => is.expected.to.have.property('items').which.has.length(3));
  });
});

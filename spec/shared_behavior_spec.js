describe('Shared behavior', function() {
  describe('`sharedExamplesFor`', function() {
    it('throws error when trying to redefine existing shared examples', function() {
      sharedExamplesFor('__test', function() {});

      expect(function() {
        sharedExamplesFor('__test')
      }).to.throw(/Attempt to override/)
    });
  });

  describe('`includeExamplesFor`', function() {
    it('throws error when trying to include non-existing shared examples', function() {
      expect(function() {
        includeExamplesFor('__non_existing')
      }).to.throw(/not defined shared behavior/)
    });

    it('calls registered shared examples', function() {
      var examples = spy();

      sharedExamplesFor('__call', examples);
      includeExamplesFor('__call');

      expect(examples).to.have.been.called();
    });

    it('passes all arguments to shared examples', function() {
      var examples = spy();
      var args = [{}, {}];

      sharedExamplesFor('__arguments', examples);
      includeExamplesFor('__arguments', args[0], args[1]);

      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);
    });
  });

  describe('`itBehavesLike`', function() {
    it('includes examples in a nested context', function() {
      var examples = spy();
      var args = [{}, {}];

      sharedExamplesFor('__Collection', examples);
      spy.on(global, 'describe', function(name, fn) {
        fn();
      });

      itBehavesLike('__Collection', args[0], args[1]);

      expect(global.describe).to.have.been.called.with('behaves like __Collection');
      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);

      spy.restore(global, 'describe');
    });
  });
});

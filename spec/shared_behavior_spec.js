describe('Shared behavior', function() {
  describe('`sharedExamplesFor`', function() {
    var defineError;

    sharedExamplesFor('__test', function() {});

    try {
      sharedExamplesFor('__test', function() {});
    } catch (error) {
      defineError = error;
    }

    it('throws error when trying to redefine existing shared examples', function() {
      expect(defineError.message).to.match(/Attempt to override/);
    });
  });

  describe('`includeExamplesFor`', function() {
    var includeError;
    var examples = spy();
    var args = [{}, {}];

    try {
      includeExamplesFor('__non_existing')
    } catch (error) {
      includeError = error;
    }

    sharedExamplesFor('__call', examples);
    includeExamplesFor('__call', args[0], args[1]);

    it('throws error when trying to include non-existing shared examples', function() {
      expect(includeError.message).to.match(/not defined shared behavior/)
    });

    it('calls registered shared examples with specified arguments', function() {
      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);
    });
  });

  describe('`itBehavesLike`', function() {
    var examples = spy();
    var args = [{}, {}];
    var spiedDescribe = spy.on(global, 'describe');

    sharedExamplesFor('__Collection', examples);
    itBehavesLike('__Collection', args[0], args[1]);
    spy.restore(global, 'describe');

    it('includes examples in a nested context', function() {
      expect(spiedDescribe).to.have.been.called.with('behaves like __Collection');
      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);
    });
  });

  describe('`sharedExamplesFor` scoping', function() {
    var isExamplesProperlyDefined;

    describe('suite with `sharedExamplesFor(__test__)`', function() {
      sharedExamplesFor('__test__', function() {
        isExamplesProperlyDefined = true;
      });
      includeExamplesFor('__test__');
    });

    describe('tests', function() {
      var missedError;

      try {
        includeExamplesFor('__test__');
      } catch (error) {
        missedError = error;
      }

      it('defines examples scoped to the suite tree', function() {
        expect(isExamplesProperlyDefined).to.be.true;
        expect(missedError).to.match(/not defined shared behavior/)
      });
    })
  });
});

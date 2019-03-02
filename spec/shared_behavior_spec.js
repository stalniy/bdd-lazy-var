describe('Shared behavior', () => {
  describe('`sharedExamplesFor`', () => {
    let defineError;

    sharedExamplesFor('__test', () => {});

    try {
      sharedExamplesFor('__test', () => {});
    } catch (error) {
      defineError = error;
    }

    it('throws error when trying to redefine existing shared examples', () => {
      expect(defineError.message).to.match(/Attempt to override/);
    });
  });

  describe('`includeExamplesFor`', () => {
    let includeError;
    const examples = spy();
    const args = [{}, {}];

    try {
      includeExamplesFor('__non_existing');
    } catch (error) {
      includeError = error;
    }

    sharedExamplesFor('__call', examples);
    includeExamplesFor('__call', args[0], args[1]);

    it('throws error when trying to include non-existing shared examples', () => {
      expect(includeError.message).to.match(/not defined shared behavior/);
    });

    it('calls registered shared examples with specified arguments', () => {
      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);
    });
  });

  describe('`itBehavesLike`', () => {
    const examples = spy();
    const args = [{}, {}];
    const spiedDescribe = spy.on(global, 'describe');

    sharedExamplesFor('__Collection', examples);
    itBehavesLike('__Collection', args[0], args[1]);
    spy.restore(global, 'describe');

    it('includes examples in a nested context', () => {
      expect(spiedDescribe).to.have.been.called.with('behaves like __Collection');
      expect(examples).to.have.been.called.with.exactly(args[0], args[1]);
    });
  });

  describe('`sharedExamplesFor` scoping', () => {
    let isExamplesProperlyDefined;

    describe('suite with `sharedExamplesFor(__test__)`', () => {
      sharedExamplesFor('__test__', () => {
        isExamplesProperlyDefined = true;
      });
      includeExamplesFor('__test__');
    });

    describe('tests', () => {
      let missedError;

      try {
        includeExamplesFor('__test__');
      } catch (error) {
        missedError = error;
      }

      it('defines examples scoped to the suite tree', () => {
        expect(isExamplesProperlyDefined).to.be.true;
        expect(missedError).to.match(/not defined shared behavior/);
      });
    });
  });
});

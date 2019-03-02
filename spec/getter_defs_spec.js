function getVar(name) {
  return get[name];
}

includeExamplesFor('Root Lazy Vars', getVar);

describe('Lazy vars defined as getter on "get" function', () => {
  includeExamplesFor('Lazy Vars Interface', getVar);

  subject(() => {
    return {};
  });

  describe('by default', () => {
    subject(() => {
      return {};
    });

    def('firstName', 'John');
    def('anotherVar', 'Doe');

    try {
      get.bddLazyCounter = 2;
      def('bddLazyCounter', 5);
    } catch (e) {
      get.bddLazyCounter = null;
    }

    it('defines a getter for lazy variable', () => {
      expect(get.subject).to.exist;
    });

    it('allows to access lazy variable value by checking property on "get" function', () => {
      expect(get.subject).to.equal(subject());
    });

    it('forwards calls to `get` function when access variable', () => {
      const accessor = spy();
      const originalGet = global.get;

      global.get = accessor;
      originalGet.anotherVar;
      global.get = originalGet;

      expect(accessor).to.have.been.called.with('anotherVar');
    });

    it('does not allow to redefine existing variable in global context', () => {
      expect(get.bddLazyCounter).to.be.null;
    });
  });
});

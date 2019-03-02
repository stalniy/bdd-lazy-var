function getVar(name) {
  return global[`$${name}`];
}

includeExamplesFor('Root Lazy Vars', getVar);

describe('Interface with globally defined lazy vars', () => {
  includeExamplesFor('Lazy Vars Interface', getVar);
  includeExamplesFor('Default suite tracking', getVar);

  describe('by default', () => {
    subject(() => {
      return {};
    });

    def('firstName', 'John');
    def('anotherVar', 'Doe');

    try {
      global.$bddLazyCounter = 2;
      def('bddLazyCounter', 5);
    } catch (e) {
      global.$bddLazyCounter = null;
    }

    it('defines a getter on global object for lazy variable with name prefixed by "$"', () => {
      expect(global.$subject).to.exist;
    });

    it('allows to access lazy variable value by its name', () => {
      expect($subject).to.equal(subject());
    });

    it('forwards calls to `get` function when access variable', () => {
      const accessor = spy();
      const originalGet = global.get;

      global.get = accessor;
      $anotherVar;
      global.get = originalGet;

      expect(accessor).to.have.been.called.with('anotherVar');
    });

    it('does not allow to redefine existing variable in global context', () => {
      expect($bddLazyCounter).to.be.null;
    });
  });
});

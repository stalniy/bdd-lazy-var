describe('Interface with globally defined lazy vars', function() {
  function getVar(name) {
    return global['$' + name];
  }

  includeExamplesFor('Lazy Vars Interface', getVar);
  includeExamplesFor('Default suite tracking', getVar);

  describe('by default', function() {
    subject(function() {
      return {};
    });

    def('firstName', 'John');
    def('anotherVar', 'Doe');

    try {
      global.$bddLazyCounter = 2;
      def('bddLazyCounter', 5);
    } catch(e) {
      global.$bddLazyCounter = null;
    }

    it('defines a getter on global object for lazy variable with name prefixed by "$"', function() {
      expect(global.$subject).to.exist;
    });

    it('allows to access lazy variable value by its name', function() {
      expect($subject).to.equal(subject());
    });

    it('forwards calls to test getter when access variable', function() {
      var accessor = spy();

      Object.defineProperty(this, 'anotherVar', { configurable: true, get: accessor });
      $anotherVar;

      expect(accessor).to.have.been.called();
    });

    it('does not allow to redefine existing variable in global context', function() {
      expect($bddLazyCounter).to.be.null;
    });
  });
});

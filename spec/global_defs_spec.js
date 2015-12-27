describe('Globally defined lazy vars', function() {
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

  describe('when suite is finished', function() {
    it('removes its variables from global scope', function() {
      expect(global.$subject).not.to.exist;
      expect(global.$firstName).not.to.exist;
      expect(global.$anotherVar).not.to.exist;
    });
  });
});

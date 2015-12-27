describe('Lazy vars defined as getter on "get" function', function() {
  describe('by default', function() {
    subject(function() {
      return {};
    });

    def('firstName', 'John');
    def('anotherVar', 'Doe');

    try {
      get.bddLazyCounter = 2;
      def('bddLazyCounter', 5);
    } catch(e) {
      get.bddLazyCounter = null;
    }

    it('defines a getter for lazy variable', function() {
      expect(get.subject).to.exist;
    });

    it('allows to access lazy variable value by checking property on "get" function', function() {
      expect(get.subject).to.equal(subject());
    });

    it('forwards calls to test getter when access variable', function() {
      var accessor = spy();

      Object.defineProperty(this, 'anotherVar', { configurable: true, get: accessor });
      get.anotherVar;

      expect(accessor).to.have.been.called();
    });

    it('does not allow to redefine existing variable in global context', function() {
      expect(get.bddLazyCounter).to.be.null;
    });
  });

  describe('when suite is finished', function() {
    it('removes getters of its variables from "get" function', function() {
      expect(get.subject).not.to.exist;
      expect(get.firstName).not.to.exist;
      expect(get.anotherVar).not.to.exist;
    });
  });
});

function getVar(name) {
  return get[name];
}

includeExamplesFor('Root Lazy Vars', getVar);

describe('Lazy vars defined as getter on "get" function', function() {
  includeExamplesFor('Lazy Vars Interface', getVar);

  subject(function() {
    return {};
  });

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

    it('forwards calls to `get` function when access variable', function() {
      var accessor = spy();
      var originalGet = global.get;

      global.get = accessor;
      originalGet.anotherVar;
      global.get = originalGet;

      expect(accessor).to.have.been.called.with('anotherVar');
    });

    it('does not allow to redefine existing variable in global context', function() {
      expect(get.bddLazyCounter).to.be.null;
    });
  });
});

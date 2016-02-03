describe('Lazy vars defined as getter on "get" function', function() {
  includeExamplesFor('Lazy Vars Interface', function(name) {
    return get[name];
  });

  subject(function() {
    return {};
  })

  describe.skip('test me', function() {
    subject(function() {
      return [];
    });

    it('is empty', function() {
      expect(get.subject).to.be.empty;
    })

    describe.skip('opa', function() {
      subject(function() {
        return 1;
      });

      it('bla', function() {
        expect(get.subject).to.equal(1);
      })
    })
  })

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
});

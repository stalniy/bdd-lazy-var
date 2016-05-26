sharedExamplesFor('Lazy Vars getters cleanup', function(getVar) {
  describe('getters cleanup', function() {
    def('persistedVar', 3);

    after('cleanups getters in parent afterAll', function() {
      expect(getVar('myVar')).not.to.exist;
      expect(getVar('persistedVar')).to.equal(3);
    });

    describe('nested suite', function() {
      describe('lazy vars', function() {
        def('myVar', 1);
        def('persistedVar', 2);

        it('defines variables', function() {
          expect(getVar('myVar')).to.equal(1);
          expect(getVar('persistedVar')).to.equal(2);
        });
      });
    });
  });
});
